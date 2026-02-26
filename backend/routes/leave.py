import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends

from database import db
from auth import get_current_user, get_admin_user
from models import (
    LeaveRequestCreate, LeaveType, LeaveRequest, LeaveBalanceResponse,
    SuccessResponse, LeaveRequestCreatedResponse
)

router = APIRouter(prefix="/api", tags=["leave"])


@router.get("/leave-types", response_model=List[LeaveType])
async def get_leave_types(current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    types = await db.leave_types.find(
        {"$or": [{"org_id": None}, {"org_id": org_id}]},
        {"_id": 0}
    ).to_list(100)
    return types


@router.post("/leave-types", response_model=LeaveType)
async def create_leave_type(data: dict, current_user: dict = Depends(get_admin_user)):
    org_id = current_user["org_id"]
    leave_type = {
        "id": str(uuid.uuid4()),
        "name": data.get("name"),
        "color": data.get("color", "#22C55E"),
        "days_per_year": data.get("days_per_year", 26),
        "org_id": org_id,
        "is_custom": True
    }
    await db.leave_types.insert_one(leave_type)
    leave_type.pop("_id", None)
    return leave_type


@router.put("/leave-types/{type_id}", response_model=SuccessResponse)
async def update_leave_type(type_id: str, data: dict, current_user: dict = Depends(get_admin_user)):
    updates = {}
    if "name" in data:
        updates["name"] = data["name"]
    if "color" in data:
        updates["color"] = data["color"]
    if "days_per_year" in data:
        updates["days_per_year"] = data["days_per_year"]
    if updates:
        await db.leave_types.update_one({"id": type_id}, {"$set": updates})
    return SuccessResponse()


@router.delete("/leave-types/{type_id}", response_model=SuccessResponse)
async def delete_leave_type(type_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.leave_types.delete_one({"id": type_id, "is_custom": True})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tipo di assenza non trovato o non eliminabile")
    return SuccessResponse()


@router.get("/leave-requests", response_model=List[LeaveRequest])
async def get_leave_requests(
    filter_status: Optional[str] = None,
    user_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user["org_id"]
    query = {"org_id": org_id}

    if current_user.get("role") != "admin":
        query["user_id"] = current_user["user_id"]
    elif user_id:
        query["user_id"] = user_id

    if filter_status:
        query["status"] = filter_status

    skip = (max(1, page) - 1) * page_size
    requests = await db.leave_requests.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).to_list(page_size)
    return requests


@router.post("/leave-requests", response_model=LeaveRequestCreatedResponse)
async def create_leave_request(data: LeaveRequestCreate, current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    user_id = current_user["user_id"]

    # Parse and validate dates
    try:
        start = datetime.strptime(data.start_date, "%Y-%m-%d")
        end = datetime.strptime(data.end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=422, detail="Formato data non valido. Usa YYYY-MM-DD")

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    
    # Validation: start date cannot be in the past
    if start < today:
        raise HTTPException(status_code=422, detail="La data di inizio non può essere nel passato")
    
    # Validation: end date must be >= start date
    if end < start:
        raise HTTPException(status_code=422, detail="La data di fine deve essere uguale o successiva alla data di inizio")
    
    # Validation: dates must be within reasonable range (max 2 years in the future)
    max_future_date = today.replace(year=today.year + 2)
    if start > max_future_date or end > max_future_date:
        raise HTTPException(status_code=422, detail="Le date non possono essere oltre 2 anni nel futuro")

    leave_type = await db.leave_types.find_one(
        {"id": data.leave_type_id, "$or": [{"org_id": None}, {"org_id": org_id}]},
        {"_id": 0}
    )
    if not leave_type:
        raise HTTPException(status_code=404, detail="Tipo di assenza non trovato")

    existing = await db.leave_requests.find_one({
        "user_id": user_id,
        "status": {"$in": ["pending", "approved"]},
        "start_date": {"$lte": data.end_date},
        "end_date": {"$gte": data.start_date}
    })
    if existing:
        raise HTTPException(status_code=400, detail="Hai già una richiesta per questo periodo")

    days = (end - start).days + 1

    request_id = str(uuid.uuid4())
    leave_request = {
        "id": request_id,
        "user_id": user_id,
        "user_name": current_user["name"],
        "org_id": org_id,
        "leave_type_id": data.leave_type_id,
        "leave_type_name": leave_type["name"],
        "start_date": data.start_date,
        "end_date": data.end_date,
        "days": days,
        "hours": data.hours,
        "notes": data.notes or "",
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    await db.leave_requests.insert_one(leave_request)

    return {"success": True, "request_id": request_id}


@router.put("/leave-requests/{request_id}/review")
async def review_leave_request(request_id: str, data: dict, current_user: dict = Depends(get_admin_user)):
    status = data.get("status")
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Stato non valido")

    leave_request = await db.leave_requests.find_one({"id": request_id}, {"_id": 0})
    if not leave_request:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")

    await db.leave_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": status,
            "reviewed_by": current_user["user_id"],
            "reviewed_at": datetime.now(timezone.utc)
        }}
    )

    if status == "approved":
        days_to_deduct = leave_request["days"] * (leave_request.get("hours", 8) / 8)
        await db.leave_balances.update_one(
            {
                "user_id": leave_request["user_id"],
                "leave_type_id": leave_request["leave_type_id"],
                "year": datetime.now(timezone.utc).year
            },
            {"$inc": {"used_days": days_to_deduct}},
            upsert=True
        )

    return {"success": True}


@router.get("/leave-balances")
async def get_leave_balances(
    page: int = 1,
    page_size: int = 50,
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user["org_id"]
    year = datetime.now(timezone.utc).year

    skip = (max(1, page) - 1) * page_size

    if current_user.get("role") == "admin":
        balances = await db.leave_balances.find(
            {"org_id": org_id, "year": year},
            {"_id": 0}
        ).skip(skip).to_list(page_size)
    else:
        balances = await db.leave_balances.find(
            {"org_id": org_id, "user_id": current_user["user_id"], "year": year},
            {"_id": 0}
        ).skip(skip).to_list(page_size)

    # Enrich with user and type info
    user_ids = list(set(b["user_id"] for b in balances))
    type_ids = list(set(b["leave_type_id"] for b in balances))

    users = {u["user_id"]: u async for u in db.users.find(
        {"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1, "name": 1}
    )}
    types = {t["id"]: t async for t in db.leave_types.find(
        {"id": {"$in": type_ids}}, {"_id": 0, "id": 1, "name": 1, "color": 1}
    )}

    for b in balances:
        u = users.get(b["user_id"], {})
        t = types.get(b["leave_type_id"], {})
        b["user_name"] = u.get("name", "")
        b["leave_type_name"] = t.get("name", "")
        b["leave_type_color"] = t.get("color", "#666")
        b["remaining_days"] = b["total_days"] - b["used_days"]

    return balances
