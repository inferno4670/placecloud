import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PlaceCloud - Placement Management System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "placecloud-super-secret-production-key-change-me-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Railway provides DATABASE_URL automatically for PostgreSQL.
    # Railway uses postgres:// prefix; SQLAlchemy needs postgresql://
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./placecloud.db")

    @property
    def db_url(self) -> str:
        """Return a SQLAlchemy-compatible DB URL."""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    # CORS — add your Railway frontend URL via FRONTEND_URL env var
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")

    @property
    def cors_origins(self) -> List[str]:
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]
        if self.FRONTEND_URL:
            origins.append(self.FRONTEND_URL)
        # Allow all origins when FRONTEND_URL is not set (dev / initial deploy)
        if not self.FRONTEND_URL:
            origins.append("*")
        return origins

    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE_MB: int = 10

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "resumes"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "logos"), exist_ok=True)

