import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends

from database import db
from auth import get_current_user, get_admin_user
from models import CompanyClosure, ClosureException, SuccessResponse

router = APIRouter(prefix="/api/closures", tags=["closures"])


@router.get("", response_model=List[CompanyClosure])
async def get_closures(
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user["org_id"]
    query = {"$or": [{"org_id": None}, {"org_id": org_id}]}

    if year:
        query["start_date"] = {"$gte": f"{year}-01-01", "$lte": f"{year}-12-31"}

    closures = await db.company_closures.find(
        query, {"_id": 0}
    ).sort("start_date", 1).to_list(500)

    return closures


@router.post("", response_model=CompanyClosure)
async def create_closure(data: dict, current_user: dict = Depends(get_admin_user)):
    org_id = current_user["org_id"]
    start_date = data.get("start_date")
    end_date = data.get("end_date") or start_date

    if not start_date:
        raise HTTPException(status_code=400, detail="Data di inizio richiesta")

    closure_id = str(uuid.uuid4())
    closure = {
        "id": closure_id,
        "org_id": org_id,
        "start_date": start_date,
        "end_date": end_date,
        "reason": data.get("reason", "Chiusura aziendale"),
        "type": data.get("type", "shutdown"),
        "auto_leave": data.get("auto_leave", False),
        "allow_exceptions": data.get("allow_exceptions", True),
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user["user_id"]
    }
    await db.company_closures.insert_one(closure)

    # Auto-create leave requests if enabled
    if data.get("auto_leave"):
        users = await db.users.find(
            {"org_id": org_id},
            {"_id": 0, "user_id": 1, "name": 1}
        ).to_list(500)

        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        days = (end - start).days + 1

        for u in users:
            await db.leave_requests.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": u["user_id"],
                "user_name": u["name"],
                "org_id": org_id,
                "leave_type_id": "ferie",
                "leave_type_name": "Ferie",
                "start_date": start_date,
                "end_date": end_date,
                "days": days,
                "hours": 8,
                "notes": f"Chiusura aziendale: {closure['reason']}",
                "status": "approved",
                "closure_id": closure_id,
                "is_closure_leave": True,
                "reviewed_by": current_user["user_id"],
                "reviewed_at": datetime.now(timezone.utc),
                "created_at": datetime.now(timezone.utc),
            })

    closure.pop("_id", None)
    return closure


@router.delete("/{closure_id}", response_model=SuccessResponse)
async def delete_closure(closure_id: str, current_user: dict = Depends(get_admin_user)):
    closure = await db.company_closures.find_one(
        {"id": closure_id, "org_id": current_user["org_id"]},
        {"_id": 0}
    )
    if not closure:
        raise HTTPException(status_code=404, detail="Chiusura non trovata")

    await db.company_closures.delete_one({"id": closure_id})
    await db.leave_requests.delete_many({"closure_id": closure_id})
    await db.closure_exceptions.delete_many({"closure_id": closure_id})

    return SuccessResponse()


@router.post("/{closure_id}/exception", response_model=ClosureException)
async def request_exception(closure_id: str, exception_data: dict, current_user: dict = Depends(get_current_user)):
    closure = await db.company_closures.find_one(
        {"id": closure_id},
        {"_id": 0}
    )
    if not closure:
        raise HTTPException(status_code=404, detail="Chiusura non trovata")

    if not closure.get("allow_exceptions"):
        raise HTTPException(status_code=400, detail="Deroghe non permesse per questa chiusura")

    exception = {
        "id": str(uuid.uuid4()),
        "closure_id": closure_id,
        "user_id": current_user["user_id"],
        "user_name": current_user["name"],
        "org_id": current_user["org_id"],
        "reason": exception_data.get("reason", ""),
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    await db.closure_exceptions.insert_one(exception)
    exception.pop("_id", None)
    return exception


@router.get("/exceptions", response_model=List[ClosureException])
async def get_exceptions(current_user: dict = Depends(get_current_user)):
    org_id = current_user["org_id"]

    if current_user.get("role") == "admin":
        exceptions = await db.closure_exceptions.find(
            {"org_id": org_id}, {"_id": 0}
        ).sort("created_at", -1).to_list(200)
    else:
        exceptions = await db.closure_exceptions.find(
            {"org_id": org_id, "user_id": current_user["user_id"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(200)

    return exceptions


@router.put("/exceptions/{exception_id}/review")
async def review_exception(exception_id: str, review_data: dict, current_user: dict = Depends(get_admin_user)):
    status = review_data.get("status")
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Stato non valido")

    exception = await db.closure_exceptions.find_one({"id": exception_id}, {"_id": 0})
    if not exception:
        raise HTTPException(status_code=404, detail="Eccezione non trovata")

    await db.closure_exceptions.update_one(
        {"id": exception_id},
        {"$set": {
            "status": status,
            "reviewed_by": current_user["user_id"],
            "reviewed_at": datetime.now(timezone.utc)
        }}
    )

    # If approved, remove auto-created leave request
    if status == "approved":
        await db.leave_requests.delete_one({
            "closure_id": exception["closure_id"],
            "user_id": exception["user_id"],
            "is_closure_leave": True
        })

    return {"success": True}
