from fastapi import APIRouter, HTTPException, Depends

from database import db
from auth import get_current_user, get_admin_user

router = APIRouter(prefix="/api", tags=["organization"])


@router.get("/organization")
async def get_organization(current_user: dict = Depends(get_current_user)):
    org = await db.organizations.find_one(
        {"org_id": current_user["org_id"]},
        {"_id": 0}
    )
    if not org:
        raise HTTPException(status_code=404, detail="Organizzazione non trovata")
    return org


@router.put("/organization")
async def update_organization(data: dict, current_user: dict = Depends(get_admin_user)):
    updates = {}
    if "name" in data:
        updates["name"] = data["name"]
    if "email" in data:
        updates["email"] = data["email"]
    if updates:
        await db.organizations.update_one(
            {"org_id": current_user["org_id"]},
            {"$set": updates}
        )
    return {"success": True}


@router.get("/settings/rules")
async def get_rules(current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    settings = await db.org_settings.find_one(
        {"org_id": org_id},
        {"_id": 0}
    )
    if not settings:
        return {
            "org_id": org_id,
            "min_notice_days": 7,
            "max_consecutive_days": 15,
            "auto_approve_under_days": 0,
            "blocked_periods": []
        }
    return settings


@router.put("/settings/rules")
async def update_rules(data: dict, current_user: dict = Depends(get_admin_user)):
    org_id = current_user["org_id"]
    updates = {"org_id": org_id}
    for key in ["min_notice_days", "max_consecutive_days", "auto_approve_under_days", "blocked_periods"]:
        if key in data:
            updates[key] = data[key]

    await db.org_settings.update_one(
        {"org_id": org_id},
        {"$set": updates},
        upsert=True
    )
    return {"success": True}
