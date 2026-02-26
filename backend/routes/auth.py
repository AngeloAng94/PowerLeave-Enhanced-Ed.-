import uuid
import httpx
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Depends, Response, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import db, init_leave_balances
from auth import (
    create_access_token, verify_password, get_password_hash,
    validate_password, get_current_user
)
from models import UserCreate, UserLogin, AuthResponse, LogoutResponse
from config import SECRET_KEY

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=AuthResponse)
@limiter.limit("10/minute")
async def register(request: Request, user_data: UserCreate, response: Response):
    validate_password(user_data.password)

    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email già registrata")

    org_id = "org_" + uuid.uuid4().hex[:8]
    user_id = "user_" + uuid.uuid4().hex[:8]
    now = datetime.now(timezone.utc)

    await db.organizations.insert_one({
        "org_id": org_id,
        "name": user_data.organization_name or f"Org di {user_data.name}",
        "created_at": now,
        "owner_id": user_id
    })

    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": get_password_hash(user_data.password),
        "role": "admin",
        "org_id": org_id,
        "picture": None,
        "created_at": now,
    }
    await db.users.insert_one(user_doc)
    await init_leave_balances(user_id, org_id, now.year)

    token = create_access_token({"sub": user_id})
    response.set_cookie(
        key="session_token", value=token,
        httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 3600
    )

    return {
        "token": token,
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": "admin",
        "org_id": org_id,
    }


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenziali non valide")

    token = create_access_token({"sub": user["user_id"]})
    response.set_cookie(
        key="session_token", value=token,
        httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 3600
    )

    return {
        "token": token,
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "org_id": user["org_id"],
        "picture": user.get("picture"),
        "message": "Benvenuto!"
    }


@router.post("/session", response_model=AuthResponse)
async def create_session(request: Request, response: Response):
    """Process OAuth session from Emergent Auth"""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request body")

    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id richiesto")

    auth_base = "https://auth.emergentapi.com"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{auth_base}/api/auth/session/{session_id}",
                timeout=10
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Sessione non valida")
            session_data = resp.json()
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Errore comunicazione auth service")

    user_info = session_data.get("user", {})
    email = user_info.get("email")
    name = user_info.get("name", email.split("@")[0] if email else "User")
    picture = user_info.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Email non presente nella sessione")

    existing_user = await db.users.find_one({"email": email})
    now = datetime.now(timezone.utc)

    if existing_user:
        user_id = existing_user["user_id"]
        org_id = existing_user["org_id"]
        role = existing_user["role"]
        if picture:
            await db.users.update_one({"user_id": user_id}, {"$set": {"picture": picture}})
    else:
        user_id = "user_" + uuid.uuid4().hex[:8]
        org_id = "org_" + uuid.uuid4().hex[:8]
        role = "admin"

        await db.organizations.insert_one({
            "org_id": org_id,
            "name": f"Org di {name}",
            "created_at": now,
            "owner_id": user_id
        })
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "password_hash": "",
            "role": role,
            "org_id": org_id,
            "picture": picture,
            "created_at": now,
        })
        await init_leave_balances(user_id, org_id, now.year)

    session_token = uuid.uuid4().hex
    await db.user_sessions.insert_one({
        "session_id": session_token,
        "user_id": user_id,
        "created_at": now,
        "expires_at": now + timedelta(days=7)
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 3600
    )

    return {
        "token": session_token,
        "user_id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "org_id": org_id,
        "picture": picture,
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/logout", response_model=LogoutResponse)
async def logout(response: Response):
    response.delete_cookie("session_token")
    return LogoutResponse(message="Logout effettuato")
