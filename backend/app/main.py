from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import get_settings
from app.core.database import get_db
from app.api.routers import auth, bookings
from app.api.routers import listings, properties, rooms, images

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — verify Supabase connection
    try:
        db = get_db()
        db.table("user_profiles").select("id").limit(1).execute()
        logger.info("✅ Supabase connection verified")
    except Exception as e:
        logger.warning(
            f"⚠️  Supabase check failed (tables may not exist yet): {e}")
    yield


app = FastAPI(
    title=settings.app_name,
    description="Real estate management platform for university student housing.",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,       prefix="/api/v1")
app.include_router(listings.router,   prefix="/api/v1")   # GET /listings  (public)
app.include_router(properties.router, prefix="/api/v1")   # /properties    (landlord + admin)
app.include_router(rooms.router,      prefix="/api/v1")   # /rooms         (landlord + public)
app.include_router(images.router,     prefix="/api/v1")   # /images        (landlord)
app.include_router(bookings.router,   prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "supabase": bool(settings.supabase_url),
    }
