from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SourceConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    endpoint: str
    domain: str
    method: str = "GET"
    params: dict[str, Any] = Field(default_factory=dict)
    rate_limit_seconds: float = Field(default=2.0, ge=2.0)
    max_retries: int = Field(default=3, ge=0, le=5)
    timeout_seconds: float = Field(default=30.0, gt=0)
    attribution_required: bool = False
    attribution_text: str | None = None
    allowed: bool = True


class SourcesConfig(BaseModel):
    user_agent: str
    sources: list[SourceConfig]


class JobRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    source: str
    source_id: str
    source_url: str
    title: str
    company: str | None = None
    description: str = ""
    location: str | None = None
    remote: bool | None = None
    employment_type: str | None = None
    seniority: str | None = None
    skills: list[str] = Field(default_factory=list)
    salary_min: float | None = None
    salary_max: float | None = None
    salary_currency: str | None = None
    salary_period: str | None = None
    published_at: datetime | None = None
    ingested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    attribution_required: bool = False
    raw_hash: str
    needs_review: bool = False

    @field_validator("title", "source", "source_id", "source_url")
    @classmethod
    def non_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("field cannot be empty")
        return value


class SourceResult(BaseModel):
    source: str
    status: str
    records: list[dict[str, Any]] = Field(default_factory=list)
    error: str | None = None
    attempts: int = 0
    elapsed_ms: float = 0.0
    http_status: int | None = None


class RunResult(BaseModel):
    started_at: datetime
    finished_at: datetime
    raw_records: int
    valid_records: int
    duplicate_records: int
    records: list[JobRecord]
    source_results: list[SourceResult]
    report: dict[str, Any] = Field(default_factory=dict)
