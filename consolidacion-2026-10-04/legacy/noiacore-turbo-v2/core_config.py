from pydantic import BaseSettings, AnyHttpUrl, Field, SecretStr
from typing import Optional

class Settings(BaseSettings):
    # Core
    environment: str = Field(default="development", description="Environment: development, staging, production")
    debug: bool = Field(default=False)

    # Database
    database_url: str = Field(description="PostgreSQL async URL: postgresql+asyncpg://user:pass@host/db")
    db_echo: bool = Field(default=False, description="Log SQL queries")
    db_pool_size: int = Field(default=20)
    db_max_overflow: int = Field(default=10)

    # Security
    admin_token: SecretStr = Field(description="Admin API token (min 32 chars)")

    # Stripe
    stripe_secret_key: SecretStr = Field(description="Stripe secret key")
    stripe_webhook_secret: SecretStr = Field(description="Stripe webhook signing secret")
    stripe_api_version: str = Field(default="2023-10-16")

    # API
    frontend_url: AnyHttpUrl = Field(default="http://localhost:3000")
    public_api_url: AnyHttpUrl = Field(default="http://localhost:8000")

    # Logging
    log_level: str = Field(default="INFO")
    sentry_dsn: Optional[str] = Field(default=None)

    # Workers
    enable_workers: bool = Field(default=True)
    worker_concurrency: int = Field(default=4)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
