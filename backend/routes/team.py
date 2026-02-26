import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends

from database import db, init_leave_balances
from auth import get_current_user, get_admin_user, get_password_hash, validate_password
from models import TeamMember, SuccessResponse, InviteResponse

logger = logging.getLogger("powerleave")
router = APIRouter(prefix="/api/team", tags=["team"])


@router.get("", response_model=List[TeamMember])
async def get_team(current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    members = await db.users.find(
        {"org_id": org_id},
        {"_id": 0, "password_hash": 0}
    ).to_list(200)
    return members


@router.post("/invite")
async def invite_member(data: dict, current_user: dict = Depends(get_admin_user)):
    org_id = current_user["org_id"]
    email = data.get("email")
    name = data.get("name", email.split("@")[0] if email else "Nuovo Membro")
    role = data.get("role", "user")

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email già registrata")

    temp_password = uuid.uuid4().hex[:8] + "1"
    validate_password(temp_password)

    user_id = "user_" + uuid.uuid4().hex[:8]
    now = datetime.now(timezone.utc)

    await db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "name": name,
        "password_hash": get_password_hash(temp_password),
        "role": role,
        "org_id": org_id,
        "picture": None,
        "created_at": now,
        "invited_by": current_user["user_id"]
    })
    await init_leave_balances(user_id, org_id, now.year)

    logger.info("Invited user %s (%s) with temp password: %s", name, email, temp_password)

    return {
        "success": True,
        "user_id": user_id,
        "message": f"Utente {name} invitato con successo. La password temporanea è stata generata."
    }


@router.put("/{user_id}")
async def update_team_member(user_id: str, data: dict, current_user: dict = Depends(get_admin_user)):
    updates = {}
    if "role" in data:
        updates["role"] = data["role"]
    if "name" in data:
        updates["name"] = data["name"]
    if updates:
        await db.users.update_one(
            {"user_id": user_id, "org_id": current_user["org_id"]},
            {"$set": updates}
        )
    return {"success": True}


@router.delete("/{user_id}")
async def remove_team_member(user_id: str, current_user: dict = Depends(get_admin_user)):
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Non puoi rimuovere te stesso")

    result = await db.users.delete_one(
        {"user_id": user_id, "org_id": current_user["org_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Membro non trovato")

    await db.leave_balances.delete_many({"user_id": user_id})
    await db.leave_requests.delete_many({"user_id": user_id})

    return {"success": True}
