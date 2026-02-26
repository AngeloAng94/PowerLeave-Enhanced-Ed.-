from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime as dt


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    organization_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class User(BaseModel):
    user_id: str
    email: str
    name: str
    role: str = "user"
    org_id: str
    picture: Optional[str] = None
    created_at: Optional[Any] = None


class Organization(BaseModel):
    org_id: str
    name: str
    created_at: Optional[Any] = None
    owner_id: Optional[str] = None
    email: Optional[str] = None


class LeaveType(BaseModel):
    id: str
    name: str
    color: str = "#22C55E"
    days_per_year: int = 26
    org_id: Optional[str] = None
    is_custom: Optional[bool] = False


class LeaveRequestCreate(BaseModel):
    leave_type_id: str
    start_date: str
    end_date: str
    hours: int = 8
    notes: Optional[str] = ""


class LeaveRequest(BaseModel):
    id: str
    user_id: str
    user_name: str
    org_id: str
    leave_type_id: str
    leave_type_name: str
    start_date: str
    end_date: str
    days: int
    hours: int = 8
    notes: Optional[str] = ""
    status: str = "pending"
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[Any] = None
    created_at: Optional[Any] = None


class LeaveBalance(BaseModel):
    user_id: str
    org_id: str
    leave_type_id: str
    year: int
    total_days: int
    used_days: float = 0


class LeaveBalanceResponse(BaseModel):
    """Extended leave balance with user and type info for API responses"""
    user_id: str
    org_id: str
    leave_type_id: str
    year: int
    total_days: int
    used_days: float = 0
    user_name: Optional[str] = ""
    leave_type_name: Optional[str] = ""
    leave_type_color: Optional[str] = "#666"
    remaining_days: Optional[float] = 0


class CompanyClosure(BaseModel):
    id: str
    org_id: Optional[str] = None
    start_date: str
    end_date: str
    reason: str
    type: str = "holiday"
    auto_leave: Optional[bool] = False
    allow_exceptions: Optional[bool] = True
    created_at: Optional[Any] = None
    created_by: Optional[str] = None


class ClosureException(BaseModel):
    id: str
    closure_id: str
    user_id: str
    user_name: str
    org_id: str
    reason: str = ""
    status: str = "pending"
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[Any] = None
    created_at: Optional[Any] = None


class TeamMember(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    picture: Optional[str] = None
    org_id: Optional[str] = None
    created_at: Optional[Any] = None
    invited_by: Optional[str] = None


class Announcement(BaseModel):
    id: str
    org_id: str
    title: str
    content: str
    priority: str = "normal"
    author_id: str
    author_name: str
    created_at: Optional[Any] = None
    expires_at: Optional[Any] = None


class OrgSettings(BaseModel):
    org_id: str
    min_notice_days: int = 7
    max_consecutive_days: int = 15
    auto_approve_under_days: int = 0
    blocked_periods: List[str] = []


class StatsResponse(BaseModel):
    approved_count: int
    pending_count: int
    total_staff: int
    available_staff: int
    on_leave_today: int
    utilization_rate: int


# ── Generic Response Models ──

class SuccessResponse(BaseModel):
    success: bool = True


class SuccessMessageResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None


class LeaveRequestCreatedResponse(BaseModel):
    success: bool = True
    request_id: str


class InviteResponse(BaseModel):
    success: bool = True
    user_id: str
    message: str


class AuthResponse(BaseModel):
    token: str
    user_id: str
    email: str
    name: str
    role: str
    org_id: str
    picture: Optional[str] = None
    message: Optional[str] = None


class LogoutResponse(BaseModel):
    message: str
