import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends

from database import db
from auth import get_current_user, get_admin_user
from models import Announcement, SuccessResponse

router = APIRouter(prefix="/api/announcements", tags=["announcements"])


@router.get("", response_model=List[Announcement])
async def get_announcements(
    page: int = 1,
    page_size: int = 20,
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user["org_id"]
    skip = (max(1, page) - 1) * page_size

    announcements = await db.announcements.find(
        {"org_id": org_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).to_list(page_size)

    return announcements


@router.post("", response_model=Announcement)
async def create_announcement(data: dict, current_user: dict = Depends(get_admin_user)):
    announcement = {
        "id": str(uuid.uuid4()),
        "org_id": current_user["org_id"],
        "title": data.get("title"),
        "content": data.get("content"),
        "priority": data.get("priority", "normal"),
        "author_id": current_user["user_id"],
        "author_name": current_user["name"],
        "created_at": datetime.now(timezone.utc),
        "expires_at": None
    }
    await db.announcements.insert_one(announcement)
    announcement.pop("_id", None)
    return announcement


@router.put("/{announcement_id}", response_model=SuccessResponse)
async def update_announcement(announcement_id: str, data: dict, current_user: dict = Depends(get_admin_user)):
    updates = {}
    for key in ["title", "content", "priority"]:
        if key in data:
            updates[key] = data[key]
    if updates:
        await db.announcements.update_one(
            {"id": announcement_id, "org_id": current_user["org_id"]},
            {"$set": updates}
        )
    return SuccessResponse()


@router.delete("/{announcement_id}", response_model=SuccessResponse)
async def delete_announcement(announcement_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.announcements.delete_one(
        {"id": announcement_id, "org_id": current_user["org_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    return SuccessResponse()
