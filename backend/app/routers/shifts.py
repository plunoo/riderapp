from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import pandas as pd

from app.database import SessionLocal
from app.models import Shift
from app.schemas import ShiftCreate, ShiftResponse, ExportRequest
from app.auth.deps import admin_only
from app.routers.admin import get_visible_rider_ids

router = APIRouter(prefix="/shifts", tags=["Shifts"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- CREATE SHIFT (ADMIN) ----------
@router.post("/create", response_model=ShiftResponse)
def create_shift(
    data: ShiftCreate,
    db: Session = Depends(get_db),
    admin=Depends(admin_only)
):
    visible = set(get_visible_rider_ids(admin, db))
    if data.rider_id not in visible:
        return {"detail": "Cannot create shift for this rider"}

    shift = Shift(
        rider_id=data.rider_id,
        start_time=data.start_time,
        end_time=data.end_time
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


# ---------- LIST SHIFTS (ADMIN) ----------
@router.get("/list", response_model=list[ShiftResponse])
def list_shifts(
    db: Session = Depends(get_db),
    admin=Depends(admin_only)
):
    rider_ids = get_visible_rider_ids(admin, db)
    return db.query(Shift).filter(Shift.rider_id.in_(rider_ids) if rider_ids else False).all()


# ---------- EXPORT SHIFTS TO EXCEL ----------
@router.post("/export")
def export_shifts(
    data: ExportRequest,
    db: Session = Depends(get_db),
    admin=Depends(admin_only)
):
    rider_ids = get_visible_rider_ids(admin, db)
    shifts = db.query(Shift).filter(
        Shift.rider_id.in_(rider_ids) if rider_ids else False,
        Shift.start_time >= data.from_date,
        Shift.end_time <= data.to_date
    ).all()

    rows = [{
        "rider_id": s.rider_id,
        "start_time": s.start_time,
        "end_time": s.end_time
    } for s in shifts]

    df = pd.DataFrame(rows)
    file_path = "/tmp/shifts.xlsx"
    df.to_excel(file_path, index=False)

    return {
        "message": "Shifts exported",
        "file": file_path
    }
