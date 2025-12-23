from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import SessionLocal
from app.models import User, RiderStatus, Attendance, Shift, RiderLocation, ImpersonationLog
from passlib.hash import bcrypt
from app.auth.deps import admin_only, prime_admin_only

router = APIRouter(prefix="/admin", tags=["Admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/add-rider")
def add_rider(
    data: dict,
    db: Session = Depends(get_db),
    admin=Depends(admin_only)
):
    """
    Add a rider. Prime admin must specify sub_admin_id.
    Sub admins can only create riders under themselves.
    """
    manager_id = None
    if admin.role == "prime_admin":
        # Prime admin can optionally assign to a sub admin, or directly manage
        sub_admin_id = data.get("sub_admin_id")
        if sub_admin_id:
            sub_admin = db.query(User).filter(User.id == sub_admin_id, User.role == "sub_admin").first()
            if not sub_admin:
                raise HTTPException(status_code=404, detail="Sub admin not found")
            manager_id = sub_admin.id
        else:
            # If no sub_admin_id provided, prime admin manages directly
            manager_id = admin.id
    else:
        manager_id = admin.id

    if not data.get("store"):
        raise HTTPException(status_code=400, detail="Store is required")

    if db.query(User).filter(User.username == data["username"]).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    # Validate required fields
    if not data.get("password"):
        raise HTTPException(status_code=400, detail="Password is required")
    
    rider = User(
        username=data["username"],
        name=data["name"],
        store=data.get("store"),
        role="rider",
        manager_id=manager_id,
        password=data["password"],  # Use plain text password (as in main.py)
        is_active=True
    )
    db.add(rider)
    db.commit()
    return {"message": "Rider added"}


@router.delete("/delete-rider")
def delete_rider(
    data: dict,
    db: Session = Depends(get_db),
    admin=Depends(admin_only)
):
    """Delete a rider by username or id."""
    rider = None
    if "id" in data:
        rider = db.query(User).filter(User.id == data["id"], User.role == "rider").first()
    elif "username" in data:
        rider = db.query(User).filter(User.username == data["username"], User.role == "rider").first()

    if not rider:
        return {"message": "Rider not found"}

    if admin.role == "sub_admin" and rider.manager_id != admin.id:
        raise HTTPException(status_code=403, detail="Cannot delete riders from other admins")

    # Remove related data explicitly to ensure cleanup on databases without ON DELETE CASCADE enforcement
    db.query(RiderStatus).filter(RiderStatus.rider_id == rider.id).delete(synchronize_session=False)
    db.query(Attendance).filter(Attendance.rider_id == rider.id).delete(synchronize_session=False)
    db.query(Shift).filter(Shift.rider_id == rider.id).delete(synchronize_session=False)
    db.query(RiderLocation).filter(RiderLocation.rider_id == rider.id).delete(synchronize_session=False)

    db.delete(rider)
    db.commit()
    return {"message": "Rider deleted"}


@router.get("/rider-status")
def rider_status(
    store: str | None = Query(default=None, description="Optional store filter (prime admin only)"),
    db: Session = Depends(get_db),
    admin=Depends(admin_only)
):
    """Return latest status per rider for the admin view."""
    rider_ids = get_visible_rider_ids(admin, db, store_filter=store)
    rows = (
        db.query(RiderStatus)
        .filter(RiderStatus.rider_id.in_(rider_ids) if rider_ids else False)
        .order_by(RiderStatus.rider_id, RiderStatus.updated_at.desc())
        .all()
    )

    latest: dict[int, RiderStatus] = {}
    for r in rows:
        if r.rider_id not in latest:
            latest[r.rider_id] = r

    data = []
    for rider_id, status in latest.items():
        user = db.query(User).filter(User.id == rider_id).first()
        data.append(
            {
                "rider_id": rider_id,
                "name": user.name if user else f"Rider {rider_id}",
                "store": getattr(user, "store", None),
                "status": status.status,
                "updated_at": status.updated_at.isoformat() if isinstance(status.updated_at, datetime) else None,
            }
        )

    return {"items": data}


@router.get("/riders")
def list_riders(
    store: str | None = Query(default=None, description="Optional store filter (prime admin only)"),
    db: Session = Depends(get_db),
    admin=Depends(admin_only)
):
    """
    Return all rider accounts with their latest status (if any).
    Falls back to 'offline' when no status exists yet.
    """
    rider_ids = get_visible_rider_ids(admin, db, store_filter=store)
    riders = (
        db.query(User)
        .filter(User.role == "rider", User.id.in_(rider_ids) if rider_ids else False)
        .all()
    )

    rows = (
        db.query(RiderStatus)
        .filter(RiderStatus.rider_id.in_(rider_ids) if rider_ids else False)
        .order_by(RiderStatus.rider_id, RiderStatus.updated_at.desc())
        .all()
    )
    latest: dict[int, RiderStatus] = {}
    for r in rows:
        if r.rider_id not in latest:
            latest[r.rider_id] = r

    items = []
    for rider in riders:
        status_row = latest.get(rider.id)
        items.append(
            {
                "id": rider.id,
                "username": rider.username,
                "name": rider.name,
                "manager_id": rider.manager_id,
                "store": getattr(rider, "store", None),
                "status": status_row.status if status_row else "offline",
                "updated_at": status_row.updated_at.isoformat() if status_row else None,
            }
        )

    return {"items": items}


@router.get("/dashboard-stats")
def dashboard_stats(
    store: str | None = Query(default=None, description="Optional store filter (prime admin only)"),
    db: Session = Depends(get_db),
    admin=Depends(admin_only)
):
    """
    Summary counts for the admin dashboard, based on latest rider status and today's attendance.
    """
    rider_ids = get_visible_rider_ids(admin, db, store_filter=store)
    total_riders = (
        db.query(User)
        .filter(User.role == "rider", User.id.in_(rider_ids) if rider_ids else False)
        .count()
    )

    rows = (
        db.query(RiderStatus)
        .filter(RiderStatus.rider_id.in_(rider_ids) if rider_ids else False)
        .order_by(RiderStatus.rider_id, RiderStatus.updated_at.desc())
        .all()
    )
    latest: dict[int, RiderStatus] = {}
    for r in rows:
        if r.rider_id not in latest:
            latest[r.rider_id] = r

    active = sum(1 for s in latest.values() if s.status != "offline")
    delivery = sum(1 for s in latest.values() if s.status == "delivery")
    available = sum(1 for s in latest.values() if s.status == "available")
    on_break = sum(1 for s in latest.values() if s.status == "break")

    today = datetime.utcnow().date()
    absent = (
        db.query(Attendance)
        .filter(
            Attendance.rider_id.in_(rider_ids) if rider_ids else False,
            Attendance.date == today,
            Attendance.status.in_(["absent", "off_day"]),
        )
        .count()
    )

    return {
        "total_riders": total_riders,
        "active": active,
        "delivery": delivery,
        "available": available,
        "on_break": on_break,
        "absent": absent,
        "updated_at": datetime.utcnow().isoformat(),
    }


# ---------- SUB ADMIN MANAGEMENT (PRIME ONLY) ----------
@router.get("/sub-admins")
def list_sub_admins(
    db: Session = Depends(get_db),
    admin=Depends(prime_admin_only)
):
    sub_admins = db.query(User).filter(User.role == "sub_admin").all()
    items = []
    for sub in sub_admins:
        rider_count = (
            db.query(User)
            .filter(User.role == "rider", User.manager_id == sub.id)
            .count()
        )
        items.append(
            {
                "id": sub.id,
                "username": sub.username,
                "name": sub.name,
                "rider_count": rider_count,
            }
        )
    return {"items": items}


@router.post("/add-sub-admin")
def add_sub_admin(
    data: dict,
    db: Session = Depends(get_db),
    admin=Depends(prime_admin_only)
):
    if db.query(User).filter(User.username == data["username"]).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    sub_admin = User(
        username=data["username"],
        name=data["name"],
        role="sub_admin",
        password=bcrypt.hash(data["password"]),
        is_active=True,
        manager_id=admin.id,
    )
    db.add(sub_admin)
    db.commit()
    return {"message": "Sub admin added"}


@router.delete("/delete-sub-admin")
def delete_sub_admin(
    data: dict,
    db: Session = Depends(get_db),
    admin=Depends(prime_admin_only)
):
    sub = None
    if "id" in data:
        sub = db.query(User).filter(User.id == data["id"], User.role == "sub_admin").first()
    elif "username" in data:
        sub = db.query(User).filter(User.username == data["username"], User.role == "sub_admin").first()

    if not sub:
        return {"message": "Sub admin not found"}

    # cascade delete riders belonging to this sub admin
    riders = db.query(User).filter(User.role == "rider", User.manager_id == sub.id).all()
    for rider in riders:
        db.query(RiderStatus).filter(RiderStatus.rider_id == rider.id).delete(synchronize_session=False)
        db.query(Attendance).filter(Attendance.rider_id == rider.id).delete(synchronize_session=False)
        db.query(Shift).filter(Shift.rider_id == rider.id).delete(synchronize_session=False)
        db.query(RiderLocation).filter(RiderLocation.rider_id == rider.id).delete(synchronize_session=False)
        db.delete(rider)

    db.delete(sub)
    db.commit()
    return {"message": "Sub admin deleted"}


def get_visible_rider_ids(admin_user: User, db: Session, store_filter: str | None = None) -> list[int]:
    q = db.query(User.id).filter(User.role == "rider")
    if admin_user.role == "prime_admin":
        if store_filter:
            q = q.filter(User.store == store_filter)
        return [r.id for r in q.all()]
    else:
        q = q.filter(User.manager_id == admin_user.id)
        if store_filter:
            q = q.filter(User.store == store_filter)
        return [r.id for r in q.all()]


@router.get("/impersonation-logs")
def impersonation_logs(
    limit: int = 20,
    db: Session = Depends(get_db),
    admin=Depends(prime_admin_only),
):
    logs = (
        db.query(ImpersonationLog)
        .order_by(ImpersonationLog.created_at.desc())
        .limit(max(1, min(limit, 100)))
        .all()
    )

    # Map user ids to names/roles
    user_ids = {log.actor_id for log in logs if log.actor_id} | {log.target_id for log in logs if log.target_id}
    user_map = {}
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        user_map = {u.id: u for u in users}

    items = []
    for log in logs:
        actor = user_map.get(log.actor_id)
        target = user_map.get(log.target_id)
        items.append(
            {
                "id": log.id,
                "actor_id": log.actor_id,
                "actor_name": actor.name if actor else None,
                "target_id": log.target_id,
                "target_name": target.name if target else None,
                "target_role": log.target_role,
                "created_at": log.created_at,
            }
        )
    return {"items": items}


@router.get("/prime-overview")
def prime_overview(
    db: Session = Depends(get_db),
    admin=Depends(prime_admin_only)
):
    """Prime admin dashboard overview of sub admins and their rider activity."""
    sub_admins = db.query(User).filter(User.role == "sub_admin").all()

    rows = (
        db.query(RiderStatus)
        .order_by(RiderStatus.rider_id, RiderStatus.updated_at.desc())
        .all()
    )
    latest: dict[int, RiderStatus] = {}
    for r in rows:
        if r.rider_id not in latest:
            latest[r.rider_id] = r

    sub_items = []
    totals = {"active": 0, "delivery": 0, "available": 0}
    store_buckets: dict[str, dict[str, int]] = {}

    for sub in sub_admins:
        rider_ids = [
            r.id for r in db.query(User.id).filter(User.role == "rider", User.manager_id == sub.id).all()
        ]
        statuses = [latest[rid] for rid in rider_ids if rid in latest]
        delivery = sum(1 for s in statuses if s.status == "delivery")
        available = sum(1 for s in statuses if s.status == "available")
        active = sum(1 for s in statuses if s.status != "offline")
        totals["delivery"] += delivery
        totals["available"] += available
        totals["active"] += active
        sub_items.append(
            {
                "id": sub.id,
                "name": sub.name,
                "username": sub.username,
                "rider_count": len(rider_ids),
                "active": active,
                "delivery": delivery,
                "available": available,
            }
        )

    # Per-store rollups
    riders = db.query(User).filter(User.role == "rider").all()
    for rider in riders:
        st = rider.store or "Unassigned"
        store_bucket = store_buckets.setdefault(
            st, {"rider_count": 0, "active": 0, "delivery": 0, "available": 0}
        )
        store_bucket["rider_count"] += 1
        status = latest.get(rider.id)
        if status:
            if status.status != "offline":
                store_bucket["active"] += 1
            if status.status == "delivery":
                store_bucket["delivery"] += 1
            if status.status == "available":
                store_bucket["available"] += 1

    store_items = [
        {"store": name, **vals}
        for name, vals in store_buckets.items()
    ]

    return {"items": sub_items, "totals": totals, "stores": store_items}
