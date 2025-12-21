from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import SessionLocal
from app.models import RiderStatus, RiderLocation
from app.schemas import RiderStatusUpdate
from app.auth.deps import rider_only, admin_only

router = APIRouter(prefix="/tracking", tags=["Tracking"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- RIDER SET STATUS ----------
@router.post("/status")
def set_status(
    data: RiderStatusUpdate,
    db: Session = Depends(get_db),
    rider=Depends(rider_only)
):
    status = RiderStatus(
        rider_id=rider.id,
        status=data.status,
        updated_at=datetime.utcnow()
    )
    db.add(status)
    db.commit()
    return {"status": "updated"}


# ---------- RIDER UPDATE LOCATION ----------
@router.post("/location")
def update_location(
    lat: float,
    lng: float,
    db: Session = Depends(get_db),
    rider=Depends(rider_only)
):
    loc = RiderLocation(
        rider_id=rider.id,
        lat=lat,
        lng=lng,
        updated_at=datetime.utcnow()
    )
    db.add(loc)
    db.commit()
    return {"location": "updated"}


# ---------- ADMIN VIEW LIVE RIDERS ----------
@router.get("/live")
def live_tracking(
    db: Session = Depends(get_db),
    admin=Depends(admin_only)
):
    locations = db.query(RiderLocation).all()
    return [{
        "rider_id": l.rider_id,
        "lat": l.lat,
        "lng": l.lng,
        "updated_at": l.updated_at
    } for l in locations]
