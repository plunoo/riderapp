from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.auth.router import router as auth_router
from app.config import (
    ADMIN_NAME,
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    AUTO_SEED_ADMIN,
    PRIME_ADMIN_NAME,
    PRIME_ADMIN_PASSWORD,
    PRIME_ADMIN_USERNAME,
)
from app.database import Base, SessionLocal, engine
from app.models import User
from app.routers import admin, attendance, riders, shifts, tracking

app = FastAPI(title="Rider Management API", version="1.0.0")

# CORS configuration for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure with specific domains in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancer and monitoring"""
    return {"status": "healthy", "service": "rider-management-api"}


@app.get("/debug-env")
async def debug_env():
    """Debug endpoint to check environment variables"""
    import os
    return {
        "AUTO_SEED_ADMIN": os.getenv("AUTO_SEED_ADMIN"),
        "ADMIN_USERNAME": os.getenv("ADMIN_USERNAME"),
        "ADMIN_PASSWORD": "***" if os.getenv("ADMIN_PASSWORD") else None,
        "PRIME_ADMIN_USERNAME": os.getenv("PRIME_ADMIN_USERNAME"),
        "PRIME_ADMIN_PASSWORD": "***" if os.getenv("PRIME_ADMIN_PASSWORD") else None,
    }

@app.post("/setup-admin")
async def setup_admin():
    """Emergency endpoint to create admin users if they don't exist"""
    db: Session = SessionLocal()
    try:
        # Create prime admin
        prime_admin = db.query(User).filter(User.username == "primeadmin").first()
        if not prime_admin:
            prime_admin = User(
                username="primeadmin",
                name="Prime Admin",
                role="prime_admin",
                password="123456789",
                is_active=True,
            )
            db.add(prime_admin)
            db.commit()
            db.refresh(prime_admin)
        
        # Create admin
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                name="System Admin",
                role="sub_admin",
                password="123456789",
                is_active=True,
                manager_id=prime_admin.id,
            )
            db.add(admin)
            db.commit()
        
        return {"status": "success", "message": "Admin users created successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        ensure_manager_column()
        if AUTO_SEED_ADMIN:
            seed_prime_admin()
            seed_default_admin()
        print("[startup] Database initialization completed successfully.")
    except Exception as e:
        print(f"[startup] Database initialization failed: {e}")


def ensure_manager_column():
    """Ensure manager_id exists on users table for hierarchy support."""
    insp = inspect(engine)
    cols = [c["name"] for c in insp.get_columns("users")]
    if "manager_id" in cols:
        return
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN manager_id INTEGER"))
            conn.commit()
            print("[startup] Added manager_id column to users.")
        except Exception as exc:  # pragma: no cover - best effort
            print(f"[startup] Skipped manager_id migration: {exc}")


def seed_prime_admin():
    """Create the prime admin if missing."""
    if not PRIME_ADMIN_USERNAME or not PRIME_ADMIN_PASSWORD:
        return

    db: Session = SessionLocal()
    try:
        existing = (
            db.query(User)
            .filter(User.username == PRIME_ADMIN_USERNAME)
            .first()
        )
        if existing:
            if existing.role != "prime_admin":
                existing.role = "prime_admin"
                db.commit()
            return

        prime = User(
            username=PRIME_ADMIN_USERNAME,
            name=PRIME_ADMIN_NAME or PRIME_ADMIN_USERNAME,
            role="prime_admin",
            password=PRIME_ADMIN_PASSWORD,
            is_active=True,
        )
        db.add(prime)
        db.commit()
        print(f"[startup] Seeded prime admin '{PRIME_ADMIN_USERNAME}'.")
    except Exception as exc:  # pragma: no cover
        print(f"[startup] Skipped prime admin seeding: {exc}")
    finally:
        db.close()


def seed_default_admin():
    """Create a default admin account if none exists (controlled by env)."""
    if not ADMIN_USERNAME or not ADMIN_PASSWORD:
        return

    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == ADMIN_USERNAME).first()
        if existing:
            return

        prime = db.query(User).filter(User.role == "prime_admin").first()
        admin = User(
            username=ADMIN_USERNAME,
            name=ADMIN_NAME or ADMIN_USERNAME,
            role="sub_admin",
            password=ADMIN_PASSWORD,
            is_active=True,
            manager_id=prime.id if prime else None,
        )
        db.add(admin)
        db.commit()
        print(f"[startup] Seeded admin user '{ADMIN_USERNAME}' (role=sub_admin).")
    except Exception as exc:  # pragma: no cover - best-effort seeding
        print(f"[startup] Skipped admin seeding: {exc}")
    finally:
        db.close()


app.include_router(auth_router)
app.include_router(admin.router)
app.include_router(riders.router)
app.include_router(attendance.router)
app.include_router(shifts.router)
app.include_router(tracking.router)
