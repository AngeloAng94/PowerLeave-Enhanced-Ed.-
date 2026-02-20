from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends

from database import db
from auth import get_current_user

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/monthly")
async def get_monthly_calendar(
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

    leaves = await db.leave_requests.find({
        "org_id": org_id,
        "status": {"$in": ["approved", "pending"]},
        "start_date": {"$lt": end_date},
        "end_date": {"$gte": start_date}
    }, {"_id": 0}).to_list(200)

    return leaves


@router.get("/closures")
async def get_calendar_closures(
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
