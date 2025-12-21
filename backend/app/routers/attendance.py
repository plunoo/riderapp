from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Attendance
from datetime import date
from app.schemas import AttendanceMark
from app.auth.deps import rider_only

router = APIRouter(prefix="/attendance", tags=["Attendance"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/mark")
def mark_attendance(
    data: AttendanceMark,
    db: Session = Depends(get_db),
    rider=Depends(rider_only)
):
    today = date.today()
    existing = (
        db.query(Attendance)
        .filter(Attendance.rider_id == rider.id, Attendance.date == today)
        .first()
    )

    if existing:
        existing.status = data.status
    else:
        a = Attendance(
            rider_id=rider.id,
            date=today,
            status=data.status
        )
        db.add(a)

    db.commit()
    return {"message": "Attendance marked"}


@router.get("/today")
def get_today_attendance(
    db: Session = Depends(get_db),
    rider=Depends(rider_only)
):
    today = date.today()
    existing = (
        db.query(Attendance)
        .filter(Attendance.rider_id == rider.id, Attendance.date == today)
        .first()
    )
    return {
        "date": today.isoformat(),
        "status": existing.status if existing else None,
    }
