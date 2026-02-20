"""
PowerLeave - Modern Leave Management Platform for Italian SMBs
Multi-tenant SaaS with JWT + Google OAuth authentication
"""

import os
import sys
import uuid
import logging
import httpx
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, status, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

# Configuration
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
SECRET_KEY = os.environ.get("SECRET_KEY")

if not MONGO_URL:
    sys.exit("FATAL: MONGO_URL environment variable is not set.")
if not DB_NAME:
    sys.exit("FATAL: DB_NAME environment variable is not set.")
if not SECRET_KEY:
    sys.exit("FATAL: SECRET_KEY environment variable is not set. Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\"")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger("powerleave")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer(auto_error=False)

# Database
client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.organizations.create_index("org_id", unique=True)
    await db.leave_requests.create_index([("org_id", 1), ("user_id", 1)])
    await db.leave_requests.create_index([("org_id", 1), ("start_date", 1)])
    await db.leave_types.create_index("org_id")
    await db.leave_balances.create_index([("org_id", 1), ("year", 1)])
    await db.announcements.create_index("org_id")
    await db.closure_exceptions.create_index("org_id")
    # Seed default leave types if empty
    if await db.leave_types.count_documents({}) == 0:
        await seed_default_data()
    yield
    client.close()

app = FastAPI(
    title="PowerLeave API",
    description="Leave Management Platform for Italian SMBs",
    version="1.0.0",
    lifespan=lifespan
)

# Rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - Allow credentials for session persistence
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://saas-tech-check.preview.emergentagent.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ============== MODELS ==============

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str
    organization_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    user_id: str
    role: str = "user"  # admin, user
    org_id: str
    picture: Optional[str] = None
    created_at: datetime

class Organization(BaseModel):
    org_id: str
    name: str
    created_at: datetime
    owner_id: str

class LeaveType(BaseModel):
    id: str
    name: str
    color: str
    days_per_year: int = 26
    org_id: Optional[str] = None  # None = global

class LeaveRequestCreate(BaseModel):
    leave_type_id: str
    start_date: str  # YYYY-MM-DD
    end_date: str
    hours: int = 8  # 2, 4, or 8
    notes: Optional[str] = None

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
    hours: int
    notes: Optional[str] = None
    request_status: str = "pending"  # pending, approved, rejected
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

class LeaveBalance(BaseModel):
    user_id: str
    org_id: str
    leave_type_id: str
    year: int
    total_days: int
    used_days: float = 0

class CompanyClosure(BaseModel):
    id: str
    org_id: str
    date: str
    reason: str
    type: str = "holiday"  # holiday, shutdown

class TeamMember(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    picture: Optional[str] = None

# ============== AUTH HELPERS ==============

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    token = None
    
    # Try cookie first
    token = request.cookies.get("session_token")
    
    # Then try Authorization header
    if not token and credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token non valido")
    except JWTError:
        # Try session token lookup
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=401, detail="Sessione non valida")
        
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Sessione scaduta")
        
        user_id = session.get("user_id")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo gli admin possono eseguire questa azione")
    return current_user

# ============== SEED DATA ==============

async def seed_default_data():
    # Default leave types (global)
    leave_types = [
        {"id": "ferie", "name": "Ferie", "color": "#22C55E", "days_per_year": 26, "org_id": None},
        {"id": "permesso", "name": "Permesso", "color": "#3B82F6", "days_per_year": 32, "org_id": None},
        {"id": "malattia", "name": "Malattia", "color": "#EF4444", "days_per_year": 180, "org_id": None},
        {"id": "maternita", "name": "Maternità/Paternità", "color": "#A855F7", "days_per_year": 150, "org_id": None},
    ]
    await db.leave_types.insert_many(leave_types)
    
    # Default Italian holidays 2026 (unified schema: start_date/end_date)
    holidays = [
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-01-01", "end_date": "2026-01-01", "reason": "Capodanno", "type": "holiday"},
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-01-06", "end_date": "2026-01-06", "reason": "Epifania", "type": "holiday"},
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-04-05", "end_date": "2026-04-05", "reason": "Pasqua", "type": "holiday"},
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-04-06", "end_date": "2026-04-06", "reason": "Lunedì dell'Angelo", "type": "holiday"},
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-04-25", "end_date": "2026-04-25", "reason": "Festa della Liberazione", "type": "holiday"},
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-05-01", "end_date": "2026-05-01", "reason": "Festa dei Lavoratori", "type": "holiday"},
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-06-02", "end_date": "2026-06-02", "reason": "Festa della Repubblica", "type": "holiday"},
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-08-15", "end_date": "2026-08-15", "reason": "Ferragosto", "type": "holiday"},
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-11-01", "end_date": "2026-11-01", "reason": "Ognissanti", "type": "holiday"},
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-12-08", "end_date": "2026-12-08", "reason": "Immacolata Concezione", "type": "holiday"},
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-12-25", "end_date": "2026-12-25", "reason": "Natale", "type": "holiday"},
        {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-12-26", "end_date": "2026-12-26", "reason": "Santo Stefano", "type": "holiday"},
    ]
    await db.company_closures.insert_many(holidays)
    
    # Create demo organization and users
    await seed_demo_users()

async def seed_demo_users():
    """Create demo users for testing"""
    # Check if demo org already exists
    demo_org = await db.organizations.find_one({"org_id": "org_demo"})
    if demo_org:
        return  # Already seeded
    
    now = datetime.now(timezone.utc)
    org_id = "org_demo"
    
    # Create demo organization
    await db.organizations.insert_one({
        "org_id": org_id,
        "name": "PowerLeave Demo",
        "created_at": now,
        "owner_id": "user_admin"
    })
    
    # Demo users
    demo_users = [
        {
            "user_id": "user_admin",
            "email": "admin@demo.it",
            "name": "Marco Rossi",
            "password_hash": pwd_context.hash("demo123"),
            "role": "admin",
            "org_id": org_id,
            "picture": None,
            "created_at": now
        },
        {
            "user_id": "user_mario",
            "email": "mario@demo.it",
            "name": "Mario Bianchi",
            "password_hash": pwd_context.hash("demo123"),
            "role": "user",
            "org_id": org_id,
            "picture": None,
            "created_at": now
        },
        {
            "user_id": "user_anna",
            "email": "anna@demo.it",
            "name": "Anna Verdi",
            "password_hash": pwd_context.hash("demo123"),
            "role": "user",
            "org_id": org_id,
            "picture": None,
            "created_at": now
        },
        {
            "user_id": "user_luigi",
            "email": "luigi@demo.it",
            "name": "Luigi Neri",
            "password_hash": pwd_context.hash("demo123"),
            "role": "user",
            "org_id": org_id,
            "picture": None,
            "created_at": now
        }
    ]
    
    await db.users.insert_many(demo_users)
    
    # Initialize leave balances for demo users
    leave_types_list = await db.leave_types.find({"org_id": None}).to_list(100)
    year = now.year
    
    for user in demo_users:
        for lt in leave_types_list:
            await db.leave_balances.insert_one({
                "user_id": user["user_id"],
                "org_id": org_id,
                "leave_type_id": lt["id"],
                "year": year,
                "total_days": lt.get("days_per_year", 26),
                "used_days": 0
            })
    
    # Create some sample leave requests
    sample_requests = [
        {
            "id": str(uuid.uuid4()),
            "user_id": "user_mario",
            "user_name": "Mario Bianchi",
            "org_id": org_id,
            "leave_type_id": "ferie",
            "leave_type_name": "Ferie",
            "start_date": "2026-03-15",
            "end_date": "2026-03-20",
            "days": 6,
            "hours": 8,
            "notes": "Vacanze di primavera",
            "status": "approved",
            "reviewed_by": "user_admin",
            "reviewed_at": now,
            "created_at": now - timedelta(days=5)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "user_anna",
            "user_name": "Anna Verdi",
            "org_id": org_id,
            "leave_type_id": "ferie",
            "leave_type_name": "Ferie",
            "start_date": "2026-08-10",
            "end_date": "2026-08-21",
            "days": 12,
            "hours": 8,
            "notes": "Ferie estive",
            "status": "pending",
            "created_at": now - timedelta(days=2)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "user_luigi",
            "user_name": "Luigi Neri",
            "org_id": org_id,
            "leave_type_id": "permesso",
            "leave_type_name": "Permesso",
            "start_date": "2026-02-20",
            "end_date": "2026-02-20",
            "days": 1,
            "hours": 4,
            "notes": "Visita medica",
            "status": "pending",
            "created_at": now - timedelta(days=1)
        }
    ]
    
    await db.leave_requests.insert_many(sample_requests)
    
    # Update leave balances for approved requests
    await db.leave_balances.update_one(
        {"user_id": "user_mario", "leave_type_id": "ferie", "year": year},
        {"$set": {"used_days": 6}}
    )

# ============== AUTH ENDPOINTS ==============

@app.post("/api/auth/register")
@limiter.limit("10/minute")
async def register(request: Request, user_data: UserCreate, response: Response):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email già registrata")
    
    # Create organization
    org_id = f"org_{uuid.uuid4().hex[:12]}"
    org_name = user_data.organization_name or f"Azienda di {user_data.name}"
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    # Create organization
    await db.organizations.insert_one({
        "org_id": org_id,
        "name": org_name,
        "created_at": now,
        "owner_id": user_id
    })
    
    # Create user
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": get_password_hash(user_data.password),
        "role": "admin",  # First user is admin
        "org_id": org_id,
        "picture": None,
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    # Initialize leave balances
    leave_types = await db.leave_types.find({"$or": [{"org_id": None}, {"org_id": org_id}]}).to_list(100)
    year = now.year
    for lt in leave_types:
        await db.leave_balances.insert_one({
            "user_id": user_id,
            "org_id": org_id,
            "leave_type_id": lt["id"],
            "year": year,
            "total_days": lt.get("days_per_year", 26),
            "used_days": 0
        })
    
    # Create token
    token = create_access_token({"sub": user_id})
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7,
        path="/"
    )
    
    return {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": "admin",
        "org_id": org_id,
        "token": token
    }

@app.post("/api/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    
    token = create_access_token({"sub": user["user_id"]})
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7,
        path="/"
    )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "user"),
        "org_id": user["org_id"],
        "picture": user.get("picture"),
        "token": token
    }

@app.post("/api/auth/session")
async def process_session(request: Request, response: Response):
    """Process session_id from Emergent OAuth - REMINDER: DO NOT HARDCODE THE URL"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id richiesto")
    
    # Get user data from Emergent Auth
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Sessione OAuth non valida")
        
        oauth_data = resp.json()
    
    email = oauth_data.get("email")
    name = oauth_data.get("name", email.split("@")[0])
    picture = oauth_data.get("picture")
    session_token = oauth_data.get("session_token")
    
    # Check if user exists
    user = await db.users.find_one({"email": email}, {"_id": 0})
    now = datetime.now(timezone.utc)
    
    if user:
        # Update existing user
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture, "last_login": now}}
        )
        user_id = user["user_id"]
        org_id = user["org_id"]
        role = user.get("role", "user")
    else:
        # Create new user with new organization
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        org_id = f"org_{uuid.uuid4().hex[:12]}"
        
        # Create organization
        await db.organizations.insert_one({
            "org_id": org_id,
            "name": f"Azienda di {name}",
            "created_at": now,
            "owner_id": user_id
        })
        
        # Create user
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": "admin",
            "org_id": org_id,
            "picture": picture,
            "created_at": now
        })
        role = "admin"
        
        # Initialize leave balances
        leave_types = await db.leave_types.find({"$or": [{"org_id": None}, {"org_id": org_id}]}).to_list(100)
        for lt in leave_types:
            await db.leave_balances.insert_one({
                "user_id": user_id,
                "org_id": org_id,
                "leave_type_id": lt["id"],
                "year": now.year,
                "total_days": lt.get("days_per_year", 26),
                "used_days": 0
            })
    
    # Store session
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "session_token": session_token,
            "expires_at": now + timedelta(days=7),
            "created_at": now
        }},
        upsert=True
    )
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7,
        path="/"
    )
    
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "org_id": org_id,
        "picture": picture
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user.get("role", "user"),
        "org_id": current_user["org_id"],
        "picture": current_user.get("picture")
    }

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="session_token", path="/")
    return {"success": True}

# ============== LEAVE TYPES ==============

@app.get("/api/leave-types")
async def get_leave_types(current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    types = await db.leave_types.find(
        {"$or": [{"org_id": None}, {"org_id": org_id}]},
        {"_id": 0}
    ).to_list(100)
    return types

@app.post("/api/leave-types")
async def create_leave_type(
    type_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Create a new leave type (admin only)"""
    org_id = current_user["org_id"]
    
    leave_type = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "name": type_data.get("name"),
        "days_per_year": type_data.get("days_per_year", 26),
        "color": type_data.get("color", "#22C55E"),
        "is_custom": True
    }
    
    await db.leave_types.insert_one(leave_type)
    return {"success": True, "id": leave_type["id"]}

@app.put("/api/leave-types/{type_id}")
async def update_leave_type(
    type_id: str,
    type_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Update a leave type (admin only)"""
    org_id = current_user["org_id"]
    
    update_fields = {}
    for field in ["name", "days_per_year", "color"]:
        if field in type_data:
            update_fields[field] = type_data[field]
    
    if update_fields:
        result = await db.leave_types.update_one(
            {"id": type_id, "$or": [{"org_id": None}, {"org_id": org_id}]},
            {"$set": update_fields}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tipo assenza non trovato")
    
    return {"success": True}

@app.delete("/api/leave-types/{type_id}")
async def delete_leave_type(
    type_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Delete a custom leave type (admin only)"""
    org_id = current_user["org_id"]
    
    # Don't allow deleting default types
    if type_id in ["ferie", "permesso", "malattia"]:
        raise HTTPException(status_code=400, detail="Non puoi eliminare i tipi predefiniti")
    
    result = await db.leave_types.delete_one({
        "id": type_id,
        "org_id": org_id,
        "is_custom": True
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tipo assenza non trovato o non eliminabile")
    
    return {"success": True}

# ============== SETTINGS/RULES ==============

@app.get("/api/settings/rules")
async def get_rules(current_user: dict = Depends(get_current_user)):
    """Get organization rules"""
    org_id = current_user["org_id"]
    
    rules = await db.org_settings.find_one(
        {"org_id": org_id, "type": "rules"},
        {"_id": 0}
    )
    
    if not rules:
        # Return defaults
        return {
            "min_notice_days": 7,
            "max_consecutive_days": 15,
            "auto_approve_under_days": 0,
            "blocked_periods": []
        }
    
    return rules

@app.put("/api/settings/rules")
async def update_rules(
    rules_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Update organization rules (admin only)"""
    org_id = current_user["org_id"]
    
    await db.org_settings.update_one(
        {"org_id": org_id, "type": "rules"},
        {"$set": {
            "org_id": org_id,
            "type": "rules",
            "min_notice_days": rules_data.get("min_notice_days", 7),
            "max_consecutive_days": rules_data.get("max_consecutive_days", 15),
            "auto_approve_under_days": rules_data.get("auto_approve_under_days", 0),
            "blocked_periods": rules_data.get("blocked_periods", []),
            "updated_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    
    return {"success": True}

# ============== LEAVE REQUESTS ==============

@app.post("/api/leave-requests")
async def create_leave_request(
    request_data: LeaveRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    org_id = current_user["org_id"]
    
    # Validate dates
    try:
        start = datetime.strptime(request_data.start_date, "%Y-%m-%d")
        end = datetime.strptime(request_data.end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato data non valido (usa YYYY-MM-DD)")
    
    if end < start:
        raise HTTPException(status_code=400, detail="La data di fine non può essere prima della data di inizio")
    
    days = (end - start).days + 1
    
    # Get leave type
    leave_type = await db.leave_types.find_one(
        {"id": request_data.leave_type_id, "$or": [{"org_id": None}, {"org_id": org_id}]},
        {"_id": 0}
    )
    if not leave_type:
        raise HTTPException(status_code=400, detail="Tipo di assenza non trovato")
    
    # Check for overlapping requests
    overlap = await db.leave_requests.find_one({
        "user_id": user_id,
        "org_id": org_id,
        "status": {"$ne": "rejected"},
        "$or": [
            {"start_date": {"$lte": request_data.end_date}, "end_date": {"$gte": request_data.start_date}}
        ]
    })
    if overlap:
        raise HTTPException(
            status_code=400,
            detail="Hai già una richiesta ferie in queste date. Verifica il calendario."
        )
    
    # Create request
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    doc = {
        "id": request_id,
        "user_id": user_id,
        "user_name": current_user["name"],
        "org_id": org_id,
        "leave_type_id": request_data.leave_type_id,
        "leave_type_name": leave_type["name"],
        "start_date": request_data.start_date,
        "end_date": request_data.end_date,
        "days": days,
        "hours": request_data.hours,
        "notes": request_data.notes,
        "status": "pending",
        "created_at": now
    }
    
    await db.leave_requests.insert_one(doc)
    
    return {"success": True, "request_id": request_id}

@app.get("/api/leave-requests")
async def get_leave_requests(
    filter_status: Optional[str] = None,
    user_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user["org_id"]
    query = {"org_id": org_id}
    
    # Non-admin users can only see their own requests
    if current_user.get("role") != "admin":
        query["user_id"] = current_user["user_id"]
    elif user_id:
        query["user_id"] = user_id
    
    if filter_status:
        query["status"] = filter_status
    
    requests = await db.leave_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return requests

@app.put("/api/leave-requests/{request_id}/review")
async def review_leave_request(
    request_id: str,
    review_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    new_status = review_data.get("status")
    if new_status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Stato non valido")
    
    org_id = current_user["org_id"]
    
    # Get the request
    leave_request = await db.leave_requests.find_one(
        {"id": request_id, "org_id": org_id},
        {"_id": 0}
    )
    
    if not leave_request:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    
    if leave_request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Questa richiesta è già stata processata")
    
    now = datetime.now(timezone.utc)
    
    # Update request status
    await db.leave_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": new_status,
            "reviewed_by": current_user["user_id"],
            "reviewed_at": now
        }}
    )
    
    # If approved, update leave balance
    if new_status == "approved":
        hours_per_day = leave_request.get("hours", 8)
        days_to_deduct = leave_request["days"] * (hours_per_day / 8)
        
        await db.leave_balances.update_one(
            {
                "user_id": leave_request["user_id"],
                "org_id": org_id,
                "leave_type_id": leave_request["leave_type_id"],
                "year": datetime.now(timezone.utc).year
            },
            {"$inc": {"used_days": days_to_deduct}},
            upsert=True
        )
    
    return {"success": True}

# ============== STATISTICS ==============

@app.get("/api/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    year = datetime.now(timezone.utc).year
    
    # Count requests
    approved_count = await db.leave_requests.count_documents({
        "org_id": org_id,
        "status": "approved",
        "start_date": {"$regex": f"^{year}"}
    })
    
    pending_count = await db.leave_requests.count_documents({
        "org_id": org_id,
        "status": "pending"
    })
    
    # Total staff
    total_staff = await db.users.count_documents({"org_id": org_id})
    
    # Staff on leave today
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    on_leave_today = await db.leave_requests.count_documents({
        "org_id": org_id,
        "status": "approved",
        "start_date": {"$lte": today},
        "end_date": {"$gte": today}
    })
    
    available_staff = total_staff - on_leave_today
    
    # Utilization rate
    balances = await db.leave_balances.find({
        "org_id": org_id,
        "year": year
    }).to_list(1000)
    
    total_days = sum(b.get("total_days", 0) for b in balances)
    used_days = sum(b.get("used_days", 0) for b in balances)
    utilization_rate = round((used_days / total_days * 100) if total_days > 0 else 0)
    
    return {
        "approved_count": approved_count,
        "pending_count": pending_count,
        "available_staff": available_staff,
        "total_staff": total_staff,
        "utilization_rate": utilization_rate
    }

# ============== CALENDAR ==============

@app.get("/api/calendar/monthly")
async def get_monthly_calendar(
    year: int,
    month: int,
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user["org_id"]
    
    # Calculate date range
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{month + 1:02d}-01"
    
    # Get leave requests that overlap with this month
    leaves = await db.leave_requests.find({
        "org_id": org_id,
        "start_date": {"$lt": end_date},
        "end_date": {"$gte": start_date}
    }, {"_id": 0}).to_list(500)
    
    return leaves

@app.get("/api/calendar/closures")
async def get_company_closures(
    year: int,
    month: int,
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user["org_id"]
    
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{month + 1:02d}-01"
    
    closures = await db.company_closures.find({
        "$or": [{"org_id": None}, {"org_id": org_id}],
        "start_date": {"$lt": end_date},
        "end_date": {"$gte": start_date}
    }, {"_id": 0}).to_list(100)
    
    return closures

# ============== TEAM ==============

@app.get("/api/team")
async def get_team_members(current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    
    members = await db.users.find(
        {"org_id": org_id},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    return members

@app.post("/api/team/invite")
async def invite_team_member(
    invite_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    email = invite_data.get("email")
    name = invite_data.get("name")
    role = invite_data.get("role", "user")
    
    if not email or not name:
        raise HTTPException(status_code=400, detail="Email e nome sono richiesti")
    
    # Check if user exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Questo utente è già registrato")
    
    org_id = current_user["org_id"]
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    # Create user with temporary password
    temp_password = uuid.uuid4().hex[:8]
    
    await db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "name": name,
        "password_hash": get_password_hash(temp_password),
        "role": role,
        "org_id": org_id,
        "created_at": now,
        "invited_by": current_user["user_id"]
    })
    
    # Initialize leave balances
    leave_types = await db.leave_types.find({"$or": [{"org_id": None}, {"org_id": org_id}]}).to_list(100)
    for lt in leave_types:
        await db.leave_balances.insert_one({
            "user_id": user_id,
            "org_id": org_id,
            "leave_type_id": lt["id"],
            "year": now.year,
            "total_days": lt.get("days_per_year", 26),
            "used_days": 0
        })
    
    # Log temp password server-side only (TODO: send via email)
    logger.info("Invited user %s (%s) with temp password: %s", name, email, temp_password)
    
    return {
        "success": True,
        "user_id": user_id,
        "message": f"Utente {name} invitato con successo. La password temporanea è stata generata."
    }

@app.put("/api/team/{user_id}")
async def update_team_member(
    user_id: str,
    update_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    org_id = current_user["org_id"]
    
    # Find user
    user = await db.users.find_one({"user_id": user_id, "org_id": org_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    # Prepare update
    update_fields = {}
    if "name" in update_data:
        update_fields["name"] = update_data["name"]
    if "role" in update_data and update_data["role"] in ["admin", "user"]:
        update_fields["role"] = update_data["role"]
    
    if update_fields:
        await db.users.update_one({"user_id": user_id}, {"$set": update_fields})
    
    return {"success": True}

@app.delete("/api/team/{user_id}")
async def remove_team_member(
    user_id: str,
    current_user: dict = Depends(get_admin_user)
):
    org_id = current_user["org_id"]
    
    # Can't remove yourself
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Non puoi rimuovere te stesso")
    
    # Find user
    user = await db.users.find_one({"user_id": user_id, "org_id": org_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    # Delete user data
    await db.users.delete_one({"user_id": user_id})
    await db.leave_balances.delete_many({"user_id": user_id})
    await db.leave_requests.delete_many({"user_id": user_id})
    
    return {"success": True}

# ============== LEAVE BALANCES ==============

@app.get("/api/leave-balances")
async def get_leave_balances(current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    year = datetime.now().year
    
    # Get all balances for org
    if current_user.get("role") == "admin":
        balances = await db.leave_balances.find(
            {"org_id": org_id, "year": year},
            {"_id": 0}
        ).to_list(1000)
    else:
        balances = await db.leave_balances.find(
            {"org_id": org_id, "user_id": current_user["user_id"], "year": year},
            {"_id": 0}
        ).to_list(100)
    
    # Fetch all users and leave types upfront to avoid N+1 queries
    user_ids = list(set(b["user_id"] for b in balances))
    leave_type_ids = list(set(b["leave_type_id"] for b in balances))
    
    users_list = await db.users.find(
        {"user_id": {"$in": user_ids}}, 
        {"_id": 0, "user_id": 1, "name": 1}
    ).to_list(1000)
    users_dict = {u["user_id"]: u.get("name", "Unknown") for u in users_list}
    
    leave_types_list = await db.leave_types.find(
        {"id": {"$in": leave_type_ids}}, 
        {"_id": 0, "id": 1, "name": 1}
    ).to_list(100)
    leave_types_dict = {lt["id"]: lt.get("name", "Unknown") for lt in leave_types_list}
    
    # Build result with lookups
    result = []
    for b in balances:
        result.append({
            "user_id": b["user_id"],
            "user_name": users_dict.get(b["user_id"], "Unknown"),
            "leave_type_id": b["leave_type_id"],
            "leave_type_name": leave_types_dict.get(b["leave_type_id"], "Unknown"),
            "total_days": b.get("total_days", 0),
            "used_days": b.get("used_days", 0),
            "remaining_days": b.get("total_days", 0) - b.get("used_days", 0)
        })
    
    return result

# ============== ORGANIZATION ==============

@app.get("/api/organization")
async def get_organization(current_user: dict = Depends(get_current_user)):
    org = await db.organizations.find_one(
        {"org_id": current_user["org_id"]},
        {"_id": 0}
    )
    return org

@app.put("/api/organization")
async def update_organization(
    update_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    org_id = current_user["org_id"]
    
    update_fields = {}
    if "name" in update_data:
        update_fields["name"] = update_data["name"]
    
    if update_fields:
        await db.organizations.update_one({"org_id": org_id}, {"$set": update_fields})
    
    return {"success": True}

# ============== ANNOUNCEMENTS (BACHECA) ==============

@app.get("/api/announcements")
async def get_announcements(current_user: dict = Depends(get_current_user)):
    """Get all announcements for the organization"""
    org_id = current_user["org_id"]
    
    announcements = await db.announcements.find(
        {"org_id": org_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return announcements

@app.post("/api/announcements")
async def create_announcement(
    announcement_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Create a new announcement (admin only)"""
    org_id = current_user["org_id"]
    now = datetime.now(timezone.utc)
    
    announcement = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "title": announcement_data.get("title"),
        "content": announcement_data.get("content"),
        "priority": announcement_data.get("priority", "normal"),  # low, normal, high
        "author_id": current_user["user_id"],
        "author_name": current_user["name"],
        "created_at": now,
        "expires_at": announcement_data.get("expires_at")  # optional
    }
    
    await db.announcements.insert_one(announcement)
    return {"success": True, "id": announcement["id"]}

@app.put("/api/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    update_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Update an announcement (admin only)"""
    org_id = current_user["org_id"]
    
    update_fields = {}
    for field in ["title", "content", "priority", "expires_at"]:
        if field in update_data:
            update_fields[field] = update_data[field]
    
    if update_fields:
        result = await db.announcements.update_one(
            {"id": announcement_id, "org_id": org_id},
            {"$set": update_fields}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Annuncio non trovato")
    
    return {"success": True}

@app.delete("/api/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Delete an announcement (admin only)"""
    org_id = current_user["org_id"]
    
    result = await db.announcements.delete_one({
        "id": announcement_id,
        "org_id": org_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    
    return {"success": True}

# ============== COMPANY CLOSURES (CHIUSURE AZIENDALI) ==============

@app.get("/api/closures")
async def get_closures(
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get company closures/shutdowns"""
    org_id = current_user["org_id"]
    
    query = {"$or": [{"org_id": None}, {"org_id": org_id}]}
    
    if year:
        query["start_date"] = {"$gte": f"{year}-01-01", "$lte": f"{year}-12-31"}
    
    closures = await db.company_closures.find(
        query,
        {"_id": 0}
    ).sort("start_date", 1).to_list(500)
    
    return closures

@app.post("/api/closures")
async def create_closure(
    closure_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Create company closure period (admin only)"""
    org_id = current_user["org_id"]
    now = datetime.now(timezone.utc)
    
    start_date = closure_data.get("start_date")
    end_date = closure_data.get("end_date") or start_date
    
    closure = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "start_date": start_date,
        "end_date": end_date,
        "reason": closure_data.get("reason"),
        "type": closure_data.get("type", "shutdown"),  # shutdown, holiday
        "auto_leave": closure_data.get("auto_leave", True),  # Auto-create leave requests
        "allow_exceptions": closure_data.get("allow_exceptions", True),  # Allow override requests
        "created_at": now,
        "created_by": current_user["user_id"]
    }
    
    await db.company_closures.insert_one(closure)
    
    # If auto_leave is enabled, create leave requests for all employees
    if closure_data.get("auto_leave", True):
        team = await db.users.find({"org_id": org_id}, {"_id": 0}).to_list(500)
        leave_type = await db.leave_types.find_one({"id": "ferie"}, {"_id": 0})
        
        for member in team:
            # Calculate days
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            days = (end - start).days + 1
            
            # Create auto leave request
            await db.leave_requests.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": member["user_id"],
                "user_name": member["name"],
                "org_id": org_id,
                "leave_type_id": "ferie",
                "leave_type_name": leave_type["name"] if leave_type else "Ferie",
                "start_date": start_date,
                "end_date": end_date,
                "days": days,
                "hours": 8,
                "notes": f"Chiusura aziendale: {closure_data.get('reason', 'Periodo di chiusura')}",
                "status": "approved",
                "closure_id": closure["id"],
                "is_closure_leave": True,
                "reviewed_by": "system",
                "reviewed_at": now,
                "created_at": now
            })
    
    return {"success": True, "id": closure["id"]}

@app.post("/api/closures/{closure_id}/exception")
async def request_closure_exception(
    closure_id: str,
    exception_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Request exception from company closure"""
    org_id = current_user["org_id"]
    user_id = current_user["user_id"]
    
    # Find the closure
    closure = await db.company_closures.find_one(
        {"id": closure_id, "org_id": org_id},
        {"_id": 0}
    )
    
    if not closure:
        raise HTTPException(status_code=404, detail="Chiusura non trovata")
    
    if not closure.get("allow_exceptions", True):
        raise HTTPException(status_code=400, detail="Le deroghe non sono permesse per questa chiusura")
    
    now = datetime.now(timezone.utc)
    
    # Create exception request
    exception = {
        "id": str(uuid.uuid4()),
        "closure_id": closure_id,
        "user_id": user_id,
        "user_name": current_user["name"],
        "org_id": org_id,
        "reason": exception_data.get("reason"),
        "status": "pending",  # pending, approved, rejected
        "created_at": now
    }
    
    await db.closure_exceptions.insert_one(exception)
    return {"success": True, "id": exception["id"]}

@app.get("/api/closures/exceptions")
async def get_closure_exceptions(
    current_user: dict = Depends(get_current_user)
):
    """Get closure exception requests"""
    org_id = current_user["org_id"]
    
    if current_user.get("role") == "admin":
        # Admin sees all exceptions
        exceptions = await db.closure_exceptions.find(
            {"org_id": org_id},
            {"_id": 0}
        ).to_list(100)
    else:
        # User sees only own exceptions
        exceptions = await db.closure_exceptions.find(
            {"org_id": org_id, "user_id": current_user["user_id"]},
            {"_id": 0}
        ).to_list(100)
    
    return exceptions

@app.put("/api/closures/exceptions/{exception_id}/review")
async def review_closure_exception(
    exception_id: str,
    review_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Approve or reject closure exception (admin only)"""
    org_id = current_user["org_id"]
    new_status = review_data.get("status")
    
    if new_status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Stato non valido")
    
    now = datetime.now(timezone.utc)
    
    result = await db.closure_exceptions.update_one(
        {"id": exception_id, "org_id": org_id},
        {"$set": {
            "status": new_status,
            "reviewed_by": current_user["user_id"],
            "reviewed_at": now
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Deroga non trovata")
    
    # If approved, cancel the auto-created leave request
    if new_status == "approved":
        exception = await db.closure_exceptions.find_one(
            {"id": exception_id},
            {"_id": 0}
        )
        if exception:
            await db.leave_requests.delete_one({
                "closure_id": exception["closure_id"],
                "user_id": exception["user_id"],
                "is_closure_leave": True
            })
    
    return {"success": True}

@app.delete("/api/closures/{closure_id}")
async def delete_closure(
    closure_id: str,
    current_user: dict = Depends(get_admin_user)
):
    org_id = current_user["org_id"]
    
    result = await db.company_closures.delete_one({
        "id": closure_id,
        "org_id": org_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chiusura non trovata")
    
    return {"success": True}

# ============== HEALTH CHECK ==============

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
