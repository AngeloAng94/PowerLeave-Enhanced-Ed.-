from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from database import db
from auth import get_current_user
from models import StatsResponse

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats", response_model=StatsResponse)
async def get_stats(current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    year = datetime.now(timezone.utc).year

    approved_count = await db.leave_requests.count_documents({
        "org_id": org_id,
        "status": "approved",
        "start_date": {"$regex": f"^{year}"}
    })

    pending_count = await db.leave_requests.count_documents({
        "org_id": org_id,
        "status": "pending"
    })

    total_staff = await db.users.count_documents({"org_id": org_id})

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    on_leave = await db.leave_requests.count_documents({
        "org_id": org_id,
        "status": "approved",
        "start_date": {"$lte": today},
        "end_date": {"$gte": today}
    })

    available_staff = total_staff - on_leave

    # Calculate utilization rate
    balances = await db.leave_balances.find(
        {"org_id": org_id, "year": year},
        {"_id": 0}
    ).to_list(1000)

    total_available = sum(b.get("total_days", 0) for b in balances)
    total_used = sum(b.get("used_days", 0) for b in balances)
    utilization_rate = round((total_used / total_available * 100) if total_available > 0 else 0)

    return {
        "approved_count": approved_count,
        "pending_count": pending_count,
        "total_staff": total_staff,
        "available_staff": available_staff,
        "on_leave_today": on_leave,
        "utilization_rate": utilization_rate,
    }
