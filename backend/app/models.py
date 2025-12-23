from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
    Float,
    Boolean,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime, date

from app.database import Base


# =========================
# USERS (ADMIN & RIDERS)
# =========================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)  # prime_admin | sub_admin | admin | rider
    store = Column(String(100), nullable=True)  # store/group name (nullable for admins)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    statuses = relationship("RiderStatus", back_populates="rider")
    attendance = relationship("Attendance", back_populates="rider")
    shifts = relationship("Shift", back_populates="rider")
    locations = relationship("RiderLocation", back_populates="rider")
    manager = relationship("User", remote_side=[id], backref="team")

    def __repr__(self):
        return f"<User id={self.id} username={self.username} role={self.role}>"



# =========================
# RIDER STATUS (LIVE)
# =========================
class RiderStatus(Base):
    __tablename__ = "rider_status"

    id = Column(Integer, primary_key=True, index=True)
    rider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status = Column(String(50), nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, index=True)

    rider = relationship("User", back_populates="statuses")

    def __repr__(self):
        return f"<RiderStatus rider_id={self.rider_id} status={self.status}>"



# =========================
# ATTENDANCE
# =========================
class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("rider_id", "date", name="unique_rider_attendance"),
    )

    id = Column(Integer, primary_key=True, index=True)
    rider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date = Column(Date, default=date.today, index=True)
    status = Column(String(20), nullable=False, index=True)  # present | absent | off_day

    created_at = Column(DateTime, default=datetime.utcnow)

    rider = relationship("User", back_populates="attendance")

    def __repr__(self):
        return f"<Attendance rider_id={self.rider_id} date={self.date} status={self.status}>"



# =========================
# SHIFTS
# =========================
class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    rider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    rider = relationship("User", back_populates="shifts")

    def __repr__(self):
        return f"<Shift rider_id={self.rider_id} {self.start_time} -> {self.end_time}>"



# =========================
# LIVE GPS TRACKING
# =========================
class RiderLocation(Base):
    __tablename__ = "rider_locations"

    id = Column(Integer, primary_key=True, index=True)
    rider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    updated_at = Column(DateTime, default=datetime.utcnow)

    rider = relationship("User", back_populates="locations")

    def __repr__(self):
        return f"<RiderLocation rider_id={self.rider_id} lat={self.lat} lng={self.lng}>"


class ImpersonationLog(Base):
    __tablename__ = "impersonation_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    target_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    target_role = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Impersonation actor={self.actor_id} target={self.target_id} role={self.target_role}>"
