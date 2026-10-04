from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FieldValue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: Any
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    source: str
    observed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    method: str = "source"


class Lineage(BaseModel):
    source: str
    url: str
    observed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    extraction_job_id: str
    extractor_version: str = "nexus-v2"
    schema_version: str = "1.0"
    raw_record_id: str
    snapshot_id: str


class RawRecord(BaseModel):
    model_config = ConfigDict(extra="allow")

    record_id: str
    source: str
    source_url: str
    payload: dict[str, Any]
    observed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    lineage: Lineage


class NormalizedRecord(BaseModel):
    model_config = ConfigDict(extra="allow")

    record_id: str
    entity_type: str
    entity_id: str
    fields: dict[str, FieldValue]
    lineage: Lineage
    dq_score: float = Field(ge=0.0, le=1.0)
    schema_version: str = "1.0"
    first_seen: datetime
    last_seen: datetime
    changed: bool = False
    removed: bool = False


class EnrichedRecord(NormalizedRecord):
    enrichment: dict[str, FieldValue] = Field(default_factory=dict)
    intelligence_score: float = Field(default=0.0, ge=0.0, le=1.0)


class Signal(BaseModel):
    signal_id: str
    type: str
    strength: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    source_count: int = Field(ge=1)
    first_seen: datetime
    last_seen: datetime
    trend: Literal["up", "down", "flat", "unknown"] = "unknown"
    evidence_ids: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Insight(BaseModel):
    insight_id: str
    observation: str
    evidence_ids: list[str] = Field(min_length=1)
    interpretation: str
    impact: str
    recommendation: str
    confidence: float = Field(ge=0.0, le=1.0)
    signal_ids: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NicheDefinition(BaseModel):
    name: str
    version: str = "1.0"
    entities: list[str]
    fields: list[str]
    metrics: list[str]
    rules: dict[str, Any] = Field(default_factory=dict)
    sources: list[str] = Field(default_factory=list)
    signals: list[str] = Field(default_factory=list)
    anomalies: list[str] = Field(default_factory=list)
    insights: list[str] = Field(default_factory=list)


class CompliancePolicy(BaseModel):
    model_config = ConfigDict(extra="forbid")

    allowed_domains: set[str] = Field(default_factory=set)
    user_agent: str = "NexusDataBot/2.0 contact=security@nexusdata.local"
    min_interval_seconds: float = Field(default=2.0, ge=2.0)
    require_terms_review: bool = True
    require_robots_review: bool = True
    blocked_domains: set[str] = Field(default_factory=set)


class SourceHealth(BaseModel):
    source: str
    status: Literal["healthy", "degraded", "blocked", "unknown"]
    success_rate: float = Field(ge=0.0, le=1.0)
    latency_ms: float = Field(ge=0.0)
    items_per_run: int = Field(ge=0)
    fields_completeness: float = Field(ge=0.0, le=1.0)
    schema_drift: bool = False
    last_success: datetime | None = None
    last_failure: datetime | None = None
    error: str | None = None


class V2RunResult(BaseModel):
    run_id: str
    snapshot_id: str
    source_health: list[SourceHealth]
    records: list[EnrichedRecord]
    signals: list[Signal]
    insights: list[Insight]
    changes: list[dict[str, Any]] = Field(default_factory=list)
    conflicts: list[dict[str, Any]] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("run_id", "snapshot_id")
    @classmethod
    def non_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("identifier cannot be empty")
        return value
