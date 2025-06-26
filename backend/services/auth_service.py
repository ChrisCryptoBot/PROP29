from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, UserRole
from schemas import LoginCredentials, TokenResponse
import os
import logging

logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """Create a JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            token_type: str = payload.get("type")
            
            if user_id is None:
                raise ValueError("Invalid token")
            
            if token_type not in ["access", "refresh"]:
                raise ValueError("Invalid token type")
            
            return {
                "user_id": user_id,
                "username": payload.get("username"),
                "email": payload.get("email"),
                "token_type": token_type
            }
        except JWTError:
            raise ValueError("Invalid token")
    
    @staticmethod
    async def authenticate_user(credentials: LoginCredentials) -> TokenResponse:
        """Authenticate user and return tokens"""
        db = SessionLocal()
        try:
            # Find user by email
            user = db.query(User).filter(User.email == credentials.email).first()
            if not user:
                raise ValueError("Invalid credentials")
            
            # Verify password
            if not AuthService.verify_password(credentials.password, user.password_hash):
                raise ValueError("Invalid credentials")
            
            # Check if user is active
            if user.status.value != "active":
                raise ValueError("User account is not active")
            
            # Update last login
            user.last_login = datetime.utcnow()
            db.commit()
            
            # Get user roles
            roles = db.query(UserRole).filter(
                UserRole.user_id == user.user_id,
                UserRole.is_active == True
            ).all()
            
            role_names = [role.role_name.value for role in roles]
            
            # Create tokens
            token_data = {
                "sub": str(user.user_id),
                "username": user.username,
                "email": user.email,
                "roles": role_names
            }
            
            access_token = AuthService.create_access_token(token_data)
            refresh_token = AuthService.create_refresh_token(token_data)
            
            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                user_id=user.user_id,
                username=user.username,
                roles=role_names
            )
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise
        finally:
            db.close()
    
    @staticmethod
    async def refresh_token(refresh_token: str) -> TokenResponse:
        """Refresh access token using refresh token"""
        try:
            # Verify refresh token
            payload = AuthService.verify_token(refresh_token)
            
            if payload["token_type"] != "refresh":
                raise ValueError("Invalid token type")
            
            # Get user from database
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.user_id == payload["user_id"]).first()
                if not user or user.status.value != "active":
                    raise ValueError("User not found or inactive")
                
                # Get user roles
                roles = db.query(UserRole).filter(
                    UserRole.user_id == user.user_id,
                    UserRole.is_active == True
                ).all()
                
                role_names = [role.role_name.value for role in roles]
                
                # Create new tokens
                token_data = {
                    "sub": str(user.user_id),
                    "username": user.username,
                    "email": user.email,
                    "roles": role_names
                }
                
                access_token = AuthService.create_access_token(token_data)
                new_refresh_token = AuthService.create_refresh_token(token_data)
                
                return TokenResponse(
                    access_token=access_token,
                    refresh_token=new_refresh_token,
                    token_type="bearer",
                    expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                    user_id=user.user_id,
                    username=user.username,
                    roles=role_names
                )
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            raise ValueError("Invalid refresh token")
    
    @staticmethod
    async def logout_user(user_id: str) -> Dict[str, str]:
        """Logout user (invalidate tokens)"""
        # In a production environment, you would add the token to a blacklist
        # For now, we'll just return a success message
        logger.info(f"User {user_id} logged out")
        return {"message": "Successfully logged out"}
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[User]:
        """Get user by ID"""
        db = SessionLocal()
        try:
            return db.query(User).filter(User.user_id == user_id).first()
        finally:
            db.close() 