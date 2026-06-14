"""Create an admin user: python -m app.scripts.create_admin"""

import uuid
import sys

from app.database.session import SessionLocal
from app.modules.auth.models import User
from app.core.security import hash_password


def create_admin(phone: str, password: str, full_name: str = "Admin"):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.phone == phone).first()
        if existing:
            existing.role = "admin"
            existing.password = hash_password(password)
            db.commit()
            print(f"Updated existing user {phone} to admin")
            return

        user = User(
            id=str(uuid.uuid4()),
            phone=phone,
            full_name=full_name,
            password=hash_password(password),
            role="admin",
            is_verified=True
        )
        db.add(user)
        db.commit()
        print(f"Admin user created: {phone}")
    finally:
        db.close()


if __name__ == "__main__":
    phone = sys.argv[1] if len(sys.argv) > 1 else "03001234567"
    password = sys.argv[2] if len(sys.argv) > 2 else "admin123"
    create_admin(phone, password)
