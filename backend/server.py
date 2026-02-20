"""
PowerLeave - Modern Leave Management Platform for Italian SMBs
Modular FastAPI application
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from database import create_indexes
from seed import seed_default_data, seed_demo_users

from routes.auth import router as auth_router, limiter
from routes.leave import router as leave_router
from routes.stats import router as stats_router
from routes.calendar import router as calendar_router
from routes.team import router as team_router
from routes.organization import router as organization_router
from routes.announcements import router as announcements_router
from routes.closures import router as closures_router


@asynccontextmanager
async def lifespan(app):
    await create_indexes()
    await seed_default_data()
    await seed_demo_users()
    yield


app = FastAPI(
    title="PowerLeave API",
    description="Leave Management Platform for Italian SMBs",
    version="1.0.0",
    lifespan=lifespan
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://saas-tech-check.preview.emergentagent.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include all routers
app.include_router(auth_router)
app.include_router(leave_router)
app.include_router(stats_router)
app.include_router(calendar_router)
app.include_router(team_router)
app.include_router(organization_router)
app.include_router(announcements_router)
app.include_router(closures_router)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
