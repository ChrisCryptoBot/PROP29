#!/usr/bin/env python3
"""
Reset admin password script
"""
import bcrypt
from database import get_db
from models import User

def reset_admin_password():
    """Reset admin password to 'admin123'"""
    db = next(get_db())
    
    # Find admin user
    admin_user = db.query(User).filter_by(username='admin').first()
    
    if not admin_user:
        print("Admin user not found. Creating new admin user...")
        # Create new admin user
        password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
        admin_user = User(
            email='admin@proper29.com',
            username='admin',
            password_hash=password_hash.decode('utf-8'),
            first_name='Admin',
            last_name='User',
            phone='555-0001',
            is_active=True,
            is_verified=True
        )
        db.add(admin_user)
    else:
        print("Admin user found. Resetting password...")
        # Reset password
        password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
        admin_user.password_hash = password_hash.decode('utf-8')
    
    db.commit()
    print("✅ Admin password reset successfully!")
    print("Username: admin")
    print("Password: admin123")
    print("Email: admin@proper29.com")

if __name__ == "__main__":
    reset_admin_password()
