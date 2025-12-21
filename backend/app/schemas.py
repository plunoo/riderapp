from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


# =====================================================
# AUTH / LOGIN
# =====================================================
class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    role: str


class LoginResponse(BaseModel):
    token: str
    user: UserResponse


# =====================================================
# USERS / RIDERS
# =====================================================
class RiderCreate(BaseModel):
    username: str
    name: str
    password: str
    store: str


class RiderResponse(BaseModel):
    id: int
    username: str
    name: str
    store: Optional[str] = None
    role: str
    is_active: bool

    class Config:
        from_attributes = True


# =====================================================
# RIDER STATUS
# =====================================================
class RiderStatusUpdate(BaseModel):
    status: str  # online | offline | off_for_delivery | available_for_delivery


class RiderStatusResponse(BaseModel):
    rider_id: int
    status: str
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# ATTENDANCE
# =====================================================
class AttendanceMark(BaseModel):
    status: str  # present | absent | off_day


class AttendanceResponse(BaseModel):
    rider_id: int
    date: date
    status: str

    class Config:
        from_attributes = True


# =====================================================
# SHIFTS
# =====================================================
class ShiftCreate(BaseModel):
    rider_id: int
    start_time: datetime
    end_time: datetime


class ShiftResponse(BaseModel):
    id: int
    rider_id: int
    start_time: datetime
    end_time: datetime

    class Config:
        from_attributes = True


# =====================================================
# LIVE TRACKING (GPS)
# =====================================================
class LocationUpdate(BaseModel):
    lat: float
    lng: float


class RiderLocationResponse(BaseModel):
    rider_id: int
    lat: float
    lng: float
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# ADMIN DASHBOARD
# =====================================================
class DashboardStats(BaseModel):
    total_riders: int
    online: int
    off_for_delivery: int
    available: int


# =====================================================
# EXPORT (EXCEL)
# =====================================================
class ExportRequest(BaseModel):
    from_date: date
    to_date: date


class ExportResponse(BaseModel):
    message: str
    file: str


# =====================================================
# IMPERSONATION
# =====================================================
class ImpersonateRequest(BaseModel):
    username: str
    password: str


class ImpersonateResponse(BaseModel):
    token: str
    user: UserResponse
