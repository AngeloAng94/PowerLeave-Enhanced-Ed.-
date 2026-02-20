from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List


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
    created_at: Optional[str] = None


class Organization(BaseModel):
    org_id: str
    name: str
    created_at: Optional[str] = None
    owner_id: Optional[str] = None


class LeaveType(BaseModel):
    id: str
    name: str
    color: str = "#22C55E"
    days_per_year: int = 26
    org_id: Optional[str] = None


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
    reviewed_at: Optional[str] = None
    created_at: Optional[str] = None


class LeaveBalance(BaseModel):
    user_id: str
    org_id: str
    leave_type_id: str
    year: int
    total_days: int
    used_days: float = 0


class CompanyClosure(BaseModel):
    id: str
    org_id: Optional[str] = None
    start_date: str
    end_date: str
    reason: str
    type: str = "holiday"


class TeamMember(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    picture: Optional[str] = None
