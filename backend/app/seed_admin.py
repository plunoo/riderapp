from sqlalchemy.orm import Session
from passlib.hash import bcrypt

from app.database import SessionLocal
from app.models import User


def create_admin():
    db: Session = SessionLocal()

    username = "admin"
    password = "admin123"   # change this before production use
    name = "System Admin"

    existing = db.query(User).filter(User.username == username).first()
    if existing:
        print("Admin already exists")
        return

    admin = User(
        username=username,
        name=name,
        role="admin",
        password=bcrypt.hash(password),
        is_active=True
    )

    db.add(admin)
    db.commit()
    print("Admin user created")


if __name__ == "__main__":
    create_admin()
