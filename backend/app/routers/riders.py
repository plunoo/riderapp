from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import SessionLocal
from app.models import RiderStatus, User
from app.schemas import RiderStatusUpdate
from app.auth.deps import rider_only

router = APIRouter(prefix="/rider", tags=["Rider"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/status")
def update_status(
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


@router.get("/queue")
def rider_queue(
    db: Session = Depends(get_db),
    rider=Depends(rider_only)
):
    """
    Return the latest status for the current rider plus the available queue ordered by
    when riders became available (oldest first).
    """
    # Latest status per rider
    rows = (
        db.query(RiderStatus)
        .order_by(RiderStatus.rider_id, RiderStatus.updated_at.desc())
        .all()
    )
    latest: dict[int, RiderStatus] = {}
    for r in rows:
        if r.rider_id not in latest:
            latest[r.rider_id] = r

    rider_ids = list(latest.keys())
    users = (
        db.query(User)
        .filter(User.id.in_(rider_ids) if rider_ids else False)
        .all()
    )
    user_map = {u.id: u for u in users}
    current_store = getattr(rider, "store", None)

    queue = []
    for rider_id, status in latest.items():
        u = user_map.get(rider_id)
        store_matches = (getattr(u, "store", None) == current_store)
        if status.status == "available" and store_matches:
            queue.append(
                {
                    "rider_id": rider_id,
                    "name": u.name if u else f"Rider {rider_id}",
                    "updated_at": status.updated_at,
                    "store": getattr(u, "store", None),
                }
            )

    # Oldest available first
    queue.sort(key=lambda x: x["updated_at"] or datetime.utcnow())

    # Current rider status
    self_status = latest.get(rider.id).status if rider.id in latest else "offline"

    # Position in queue (1-based)
    position = None
    for idx, item in enumerate(queue):
        if item["rider_id"] == rider.id:
            position = idx + 1
            break

    # Serialize datetime
    for item in queue:
        if item["updated_at"]:
            item["updated_at"] = item["updated_at"].isoformat()

    return {
        "status": self_status,
        "queue": queue,
        "position": position,
        "total_waiting": len(queue),
    }
