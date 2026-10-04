from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from core_config import settings
from db_session import engine, Base
from api_routes_orders import router as orders_router
from api_routes_webhook import router as webhook_router
from api_routes_admin import router as admin_router
import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    # Startup
    logger.info("Starting NoiaCore + AUREA X application")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    logger.info("Shutting down application")
    await engine.dispose()

app = FastAPI(
    title="NoiaCore + AUREA X",
    description="Production-ready autonomous enterprise system",
    version="2.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(settings.frontend_url)],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.railway.app", "*.vercel.app"]
)

# Routes
app.include_router(orders_router)
app.include_router(webhook_router)
app.include_router(admin_router)

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "NoiaCore",
        "environment": settings.environment,
        "version": "2.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "NoiaCore + AUREA X API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_app:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
