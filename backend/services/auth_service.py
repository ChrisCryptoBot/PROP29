from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from database import SessionLocal
from models import User, UserRole
from schemas import LoginCredentials, TokenResponse
import os
import logging
import asyncio
from functools import wraps
import time

logger = logging.getLogger(__name__)

# Enhanced security configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Rate limiting configuration
MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
LOGIN_TIMEOUT_MINUTES = int(os.getenv("LOGIN_TIMEOUT_MINUTES", "15"))

# Password hashing with enhanced security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# Rate limiting storage (in-memory; use Redis in multi-instance production)
login_attempts: Dict[str, Dict[str, Any]] = {}

def rate_limit_login(ip_address: str) -> bool:
    """
    Rate limit login attempts per IP address.
    Returns True if allowed, False if rate limited.
    Max MAX_LOGIN_ATTEMPTS per LOGIN_TIMEOUT_MINUTES.
    """
    current_time = time.time()
    window_seconds = LOGIN_TIMEOUT_MINUTES * 60
    if ip_address not in login_attempts:
        login_attempts[ip_address] = {"count": 0, "first_attempt": current_time}
    attempts = login_attempts[ip_address]
    if current_time - attempts["first_attempt"] > window_seconds:
        attempts["count"] = 0
        attempts["first_attempt"] = current_time
    if attempts["count"] >= MAX_LOGIN_ATTEMPTS:
        return False
    attempts["count"] += 1
    return True

def clear_rate_limit(ip_address: str) -> None:
    """Clear rate limit after successful login."""
    if ip_address in login_attempts:
        del login_attempts[ip_address]

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {str(e)}")
            return False
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password with enhanced security"""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token with enhanced security"""
        to_encode = data.copy()
        now = datetime.utcnow()
        if expires_delta:
            expire = now + expires_delta
        else:
            expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        # Use numeric timestamps (NumericDate) for JWT compatibility
        to_encode.update({
            "exp": int(expire.timestamp()),
            "type": "access",
            "iat": int(now.timestamp()),
            "iss": "proper29-api"
        })
        
        try:
            encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt if isinstance(encoded_jwt, str) else encoded_jwt.decode("utf-8")
        except Exception as e:
            logger.error(f"Token creation error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token creation failed"
            )
    
    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """Create a JWT refresh token"""
        to_encode = data.copy()
        now = datetime.utcnow()
        expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({
            "exp": int(expire.timestamp()),
            "type": "refresh",
            "iat": int(now.timestamp()),
            "iss": "proper29-api"
        })
        
        try:
            encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt if isinstance(encoded_jwt, str) else encoded_jwt.decode("utf-8")
        except Exception as e:
            logger.error(f"Refresh token creation error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Refresh token creation failed"
            )
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """Verify and decode a JWT token with enhanced validation"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            token_type: str = payload.get("type")
            issuer: str = payload.get("iss")
            
            if user_id is None:
                raise ValueError("Invalid token: missing user ID")
            
            if token_type not in ["access", "refresh"]:
                raise ValueError("Invalid token type")
            
            if issuer != "proper29-api":
                raise ValueError("Invalid token issuer")
            
            return {
                "user_id": user_id,
                "username": payload.get("username"),
                "email": payload.get("email"),
                "token_type": token_type,
                "roles": payload.get("roles", [])
            }
        except JWTError as e:
            logger.warning(f"JWT decode error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token verification failed"
            )
    
    @staticmethod
    async def authenticate_user(credentials: LoginCredentials, ip_address: str) -> TokenResponse:
        """Authenticate user with rate limiting and enhanced security"""
        # Rate limiting check
        if not rate_limit_login(ip_address):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts. Try again in {LOGIN_TIMEOUT_MINUTES} minutes."
            )
        
        db = SessionLocal()
        try:
            # Find user by email
            user = db.query(User).filter(User.email == credentials.email).first()
            if not user:
                logger.warning(f"Login attempt with invalid email: {credentials.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
            
            # Verify password
            if not AuthService.verify_password(credentials.password, user.password_hash):
                logger.warning(f"Failed login attempt for user: {user.user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
            
            # Check if user is active
            if user.status.value != "active":
                logger.warning(f"Login attempt for inactive user: {user.user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Account is not active"
                )
            
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
            
            # Reset rate limiting on successful login
            clear_rate_limit(ip_address)
            
            logger.info(f"Successful login for user: {user.user_id}")
            
            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                user_id=user.user_id,
                username=user.username,
                roles=role_names
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication failed"
            )
        finally:
            db.close()
    
    @staticmethod
    async def refresh_token(refresh_token: str) -> TokenResponse:
        """Refresh access token using refresh token"""
        try:
            # Verify refresh token
            payload = AuthService.verify_token(refresh_token)
            
            if payload["token_type"] != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            # Get user from database
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.user_id == payload["user_id"]).first()
                if not user or user.status.value != "active":
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User not found or inactive"
                    )
                
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
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    
    @staticmethod
    async def logout_user(user_id: str) -> Dict[str, str]:
        """Logout user (invalidate tokens)"""
        # In a production environment, you would add the token to a blacklist
        # For now, we'll just return a success message
        logger.info(f"User {user_id} logged out")
        return {"message": "Successfully logged out"}
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[User]:
        """Get user by ID with proper error handling"""
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.user_id == user_id).first()
            return user
        except Exception as e:
            logger.error(f"Error getting user by ID: {str(e)}")
            return None
        finally:
            db.close() 