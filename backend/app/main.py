import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
import app.models  # Ensure all models are registered
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    try:
        from app.seed import seed
        seed()
    except Exception as e:
        print(f"Startup seed notice: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Centralized Cloud-Based Placement Management System with Automated Eligibility Evaluation and Real-Time Analytics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads (resumes, company logos)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include master API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api")  # fallback alias

@app.get("/")
def root():
    return {
        "message": "Welcome to PlaceCloud API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "PlaceCloud Backend"}

# Railway healthcheck alias
@app.get("/api/v1/health")
def health_check_v1():
    return {"status": "healthy", "service": "PlaceCloud Backend"}

