import os
from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "NaviQGreen"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "naviqgreen-super-secret-key-change-in-production-only"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Database
    DATABASE_URL: str = "sqlite:///./naviqgreen.db"
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # File paths
    ARTIFACTS_DIR: str = str(BASE_DIR / "artifacts")
    DATASETS_DIR: str = str(BASE_DIR / "data")

    @field_validator("ARTIFACTS_DIR", "DATASETS_DIR", mode="after")
    def resolve_paths(cls, v: str) -> str:
        p = Path(v)
        if not p.is_absolute():
            return str((BASE_DIR / p).resolve())
        return str(p.resolve())

    model_config = SettingsConfigDict(
        env_file=(".env", str(BASE_DIR / ".env"), str(BASE_DIR.parent / ".env")),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
Path(settings.ARTIFACTS_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.DATASETS_DIR).mkdir(parents=True, exist_ok=True)
