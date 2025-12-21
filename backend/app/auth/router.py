from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from app.database import SessionLocal
from app.models import User, ImpersonationLog
from app.auth.jwt import create_access_token
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.auth.deps import get_current_user
from app.schemas import ImpersonateRequest, ImpersonateResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data["username"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if password is plain text (for migration) or hashed
    if user.password.startswith('$2b$'):
        # Hashed password - use bcrypt verification
        try:
            password_valid = bcrypt.verify(data["password"], user.password)
        except:
            password_valid = False
    else:
        # Plain text password - direct comparison (for development)
        password_valid = data["password"] == user.password
    
    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        {"sub": user.username, "role": user.role, "id": user.id},
        ACCESS_TOKEN_EXPIRE_MINUTES
    )

    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role,
            "store": getattr(user, "store", None),
            "manager_id": getattr(user, "manager_id", None),
        }
    }


@router.post("/impersonate", response_model=ImpersonateResponse)
def impersonate(
    data: ImpersonateRequest,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    target = db.query(User).filter(User.username == data.username).first()
    if not target or not bcrypt.verify(data.password, target.password):
        raise HTTPException(status_code=401, detail="Invalid target credentials")

    if actor.role == "prime_admin":
        if target.role not in {"sub_admin", "rider"}:
            raise HTTPException(status_code=403, detail="Prime admin can only impersonate sub admin or rider")
    elif actor.role == "sub_admin":
        if target.role != "rider" or target.manager_id != actor.id:
            raise HTTPException(status_code=403, detail="Sub admin can only impersonate their own riders")
    else:
        raise HTTPException(status_code=403, detail="Impersonation not allowed for this role")

    token = create_access_token(
        {"sub": target.username, "role": target.role, "id": target.id},
        ACCESS_TOKEN_EXPIRE_MINUTES
    )

    log = ImpersonationLog(
        actor_id=actor.id,
        target_id=target.id,
        target_role=target.role,
    )
    db.add(log)
    db.commit()

    return {
        "token": token,
        "user": {
            "id": target.id,
            "name": target.name,
            "role": target.role,
            "store": getattr(target, "store", None),
            "manager_id": getattr(target, "manager_id", None),
        }
    }
