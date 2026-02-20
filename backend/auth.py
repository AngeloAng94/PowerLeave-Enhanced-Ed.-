import re
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_DAYS
from database import db

logger = logging.getLogger("powerleave")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=422, detail="La password deve avere almeno 8 caratteri")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=422, detail="La password deve contenere almeno un numero")


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    token = None

    # Try cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        token = session_token

    # Then try Bearer header
    if not token and credentials:
        token = credentials.credentials

    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token non valido")
    except JWTError:
        # Try session lookup (for OAuth)
        session = await db.user_sessions.find_one({"session_id": token})
        if session:
            if session.get("expires_at") and session["expires_at"] < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Sessione scaduta")
            user_id = session.get("user_id")
        else:
            raise HTTPException(status_code=401, detail="Token non valido")

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="Utente non trovato")

    return user


async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    return current_user
