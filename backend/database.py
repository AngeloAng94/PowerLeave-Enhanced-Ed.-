import logging
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URL, DB_NAME

logger = logging.getLogger("powerleave")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


async def create_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.organizations.create_index("org_id", unique=True)
    await db.leave_requests.create_index([("org_id", 1), ("user_id", 1)])
    await db.leave_requests.create_index([("org_id", 1), ("start_date", 1)])
    await db.leave_types.create_index("org_id")
    await db.leave_balances.create_index([("org_id", 1), ("year", 1)])
    await db.announcements.create_index("org_id")
    await db.closure_exceptions.create_index("org_id")


async def init_leave_balances(user_id: str, org_id: str, year: int):
    """Centralized helper to initialize leave balances for a new user.
    Used by register, invite, and OAuth flows (resolves D08 duplication)."""
    leave_types = await db.leave_types.find(
        {"$or": [{"org_id": None}, {"org_id": org_id}]},
        {"_id": 0}
    ).to_list(100)
    for lt in leave_types:
        existing = await db.leave_balances.find_one({
            "user_id": user_id, "org_id": org_id,
            "leave_type_id": lt["id"], "year": year
        })
        if not existing:
            await db.leave_balances.insert_one({
                "user_id": user_id, "org_id": org_id,
                "leave_type_id": lt["id"], "year": year,
                "total_days": lt["days_per_year"],
                "used_days": 0
            })
