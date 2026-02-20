import uuid
from datetime import datetime, timedelta, timezone

from database import db, init_leave_balances
from auth import get_password_hash


async def seed_default_data():
    existing_types = await db.leave_types.count_documents({})
    if existing_types == 0:
        default_types = [
            {"id": "ferie", "name": "Ferie", "color": "#22C55E", "days_per_year": 26, "org_id": None},
            {"id": "permesso", "name": "Permesso", "color": "#3B82F6", "days_per_year": 32, "org_id": None},
            {"id": "malattia", "name": "Malattia", "color": "#EF4444", "days_per_year": 180, "org_id": None},
            {"id": "maternita", "name": "Maternità/Paternità", "color": "#A855F7", "days_per_year": 150, "org_id": None},
        ]
        await db.leave_types.insert_many(default_types)

    existing_closures = await db.company_closures.count_documents({})
    if existing_closures == 0:
        holidays = [
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-01-01", "end_date": "2026-01-01", "reason": "Capodanno", "type": "holiday"},
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-01-06", "end_date": "2026-01-06", "reason": "Epifania", "type": "holiday"},
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-04-05", "end_date": "2026-04-05", "reason": "Pasqua", "type": "holiday"},
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-04-06", "end_date": "2026-04-06", "reason": "Lunedì dell'Angelo", "type": "holiday"},
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-04-25", "end_date": "2026-04-25", "reason": "Festa della Liberazione", "type": "holiday"},
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-05-01", "end_date": "2026-05-01", "reason": "Festa dei Lavoratori", "type": "holiday"},
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-06-02", "end_date": "2026-06-02", "reason": "Festa della Repubblica", "type": "holiday"},
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-08-15", "end_date": "2026-08-15", "reason": "Ferragosto", "type": "holiday"},
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-11-01", "end_date": "2026-11-01", "reason": "Ognissanti", "type": "holiday"},
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-12-08", "end_date": "2026-12-08", "reason": "Immacolata Concezione", "type": "holiday"},
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-12-25", "end_date": "2026-12-25", "reason": "Natale", "type": "holiday"},
            {"id": str(uuid.uuid4()), "org_id": None, "start_date": "2026-12-26", "end_date": "2026-12-26", "reason": "Santo Stefano", "type": "holiday"},
        ]
        await db.company_closures.insert_many(holidays)


async def seed_demo_users():
    existing = await db.users.find_one({"email": "admin@demo.it"})
    if existing:
        return

    org_id = "org_demo"
    now = datetime.now(timezone.utc)

    await db.organizations.insert_one({
        "org_id": org_id, "name": "PowerLeave Demo",
        "created_at": now, "owner_id": "user_admin"
    })

    users = [
        {"user_id": "user_admin", "email": "admin@demo.it", "name": "Marco Rossi",
         "password_hash": get_password_hash("demo123"), "role": "admin",
         "org_id": org_id, "picture": None, "created_at": now},
        {"user_id": "user_mario", "email": "mario@demo.it", "name": "Mario Bianchi",
         "password_hash": get_password_hash("demo123"), "role": "user",
         "org_id": org_id, "picture": None, "created_at": now},
        {"user_id": "user_anna", "email": "anna@demo.it", "name": "Anna Verdi",
         "password_hash": get_password_hash("demo123"), "role": "user",
         "org_id": org_id, "picture": None, "created_at": now},
        {"user_id": "user_luigi", "email": "luigi@demo.it", "name": "Luigi Neri",
         "password_hash": get_password_hash("demo123"), "role": "user",
         "org_id": org_id, "picture": None, "created_at": now},
    ]
    await db.users.insert_many(users)

    year = now.year
    for u in users:
        await init_leave_balances(u["user_id"], org_id, year)

    # Sample leave requests
    sample_requests = [
        {"id": str(uuid.uuid4()), "user_id": "user_mario", "user_name": "Mario Bianchi",
         "org_id": org_id, "leave_type_id": "ferie", "leave_type_name": "Ferie",
         "start_date": f"{year}-03-15", "end_date": f"{year}-03-20", "days": 6, "hours": 8,
         "notes": "Vacanze di primavera", "status": "approved",
         "reviewed_by": "user_admin", "reviewed_at": now,
         "created_at": now - timedelta(days=5)},
        {"id": str(uuid.uuid4()), "user_id": "user_anna", "user_name": "Anna Verdi",
         "org_id": org_id, "leave_type_id": "permesso", "leave_type_name": "Permesso",
         "start_date": f"{year}-03-10", "end_date": f"{year}-03-10", "days": 1, "hours": 4,
         "notes": "Visita medica", "status": "approved",
         "reviewed_by": "user_admin", "reviewed_at": now,
         "created_at": now - timedelta(days=8)},
        {"id": str(uuid.uuid4()), "user_id": "user_luigi", "user_name": "Luigi Neri",
         "org_id": org_id, "leave_type_id": "ferie", "leave_type_name": "Ferie",
         "start_date": f"{year}-04-01", "end_date": f"{year}-04-05", "days": 5, "hours": 8,
         "notes": "Ponte di Pasqua", "status": "pending",
         "created_at": now - timedelta(days=2)},
    ]
    await db.leave_requests.insert_many(sample_requests)

    # Update balances for approved requests
    await db.leave_balances.update_one(
        {"user_id": "user_mario", "leave_type_id": "ferie", "year": year},
        {"$inc": {"used_days": 6}}
    )
    await db.leave_balances.update_one(
        {"user_id": "user_anna", "leave_type_id": "permesso", "year": year},
        {"$inc": {"used_days": 0.5}}
    )
