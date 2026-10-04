from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from .acquisition import APIProvider, AcquisitionBus, AcquisitionRequest, CustomYamlProvider, ExternalProviderUnavailable
from .models import SourcesConfig
from .intelligence_v2 import build_insights, build_signals, deduplicate, detect_changes, jobs_niche, normalize_records
from .v2_models import CompliancePolicy, EnrichedRecord, SourceHealth, V2RunResult


def _init_v2_db(path: str | Path) -> None:
    with sqlite3.connect(path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS nexus_snapshots (
                snapshot_id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                niche TEXT NOT NULL,
                created_at TEXT NOT NULL,
                record_count INTEGER NOT NULL,
                payload_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS nexus_lineage (
                raw_record_id TEXT PRIMARY KEY,
                snapshot_id TEXT NOT NULL,
                source TEXT NOT NULL,
                url TEXT NOT NULL,
                observed_at TEXT NOT NULL,
                extraction_job_id TEXT NOT NULL,
                extractor_version TEXT NOT NULL,
                schema_version TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS nexus_source_health (
                run_id TEXT NOT NULL,
                source TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                PRIMARY KEY (run_id, source)
            );
            """
        )


def _previous_records(path: str | Path, niche: str) -> list[EnrichedRecord]:
    with sqlite3.connect(path) as conn:
        row = conn.execute("SELECT payload_json FROM nexus_snapshots WHERE niche = ? ORDER BY created_at DESC LIMIT 1", (niche,)).fetchone()
    if not row:
        return []
    payload = json.loads(row[0])
    return [EnrichedRecord.model_validate(item) for item in payload]


def _save_v2(path: str | Path, result: V2RunResult) -> None:
    with sqlite3.connect(path) as conn:
        conn.execute("INSERT INTO nexus_snapshots VALUES (?, ?, ?, ?, ?, ?)", (result.snapshot_id, result.run_id, "tech_remote_jobs", result.generated_at.isoformat(), len(result.records), json.dumps([r.model_dump(mode="json") for r in result.records], ensure_ascii=False)))
        for record in result.records:
            lineage = record.lineage
            conn.execute("INSERT OR REPLACE INTO nexus_lineage VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (record.record_id, result.snapshot_id, lineage.source, lineage.url, lineage.observed_at.isoformat(), lineage.extraction_job_id, lineage.extractor_version, lineage.schema_version))
        for health in result.source_health:
            conn.execute("INSERT OR REPLACE INTO nexus_source_health VALUES (?, ?, ?)", (result.run_id, health.source, health.model_dump_json()))


async def run_intelligence_pipeline(config: SourcesConfig, db_path: str | Path = "nexus.db", provider_by_source: dict[str, str] | None = None) -> V2RunResult:
    run_id = str(uuid.uuid4())
    snapshot_id = str(uuid.uuid4())
    _init_v2_db(db_path)
    policy = CompliancePolicy(user_agent=config.user_agent, allowed_domains={source.domain for source in config.sources})
    bus = AcquisitionBus(
        providers={
            "official_api": APIProvider(policy),
            "yaml_http": CustomYamlProvider(policy),
            "crawlee": ExternalProviderUnavailable("crawlee"),
            "crawl4ai": ExternalProviderUnavailable("crawl4ai"),
            "firecrawl": ExternalProviderUnavailable("firecrawl"),
            "playwright": ExternalProviderUnavailable("playwright"),
        }
    )
    try:
        requests = [AcquisitionRequest(source=source, job_id=run_id, snapshot_id=snapshot_id) for source in config.sources]
        source_results, raw_records = await bus.run(requests, provider_by_source)
    finally:
        await bus.close()
    niche = jobs_niche()
    previous = _previous_records(db_path, niche.name)
    normalized = normalize_records(raw_records, niche)
    records, duplicate_ids = deduplicate(normalized)
    changes = detect_changes(records, previous)
    signals = build_signals(records, changes)
    insights = build_insights(records, signals, changes)
    source_health: list[SourceHealth] = []
    for source_result in source_results:
        source_records = [raw for raw in raw_records if raw.source == source_result.source]
        complete = sum(record.dq_score for record in records if record.lineage.source == source_result.source) / max(1, len([record for record in records if record.lineage.source == source_result.source]))
        source_health.append(SourceHealth(source=source_result.source, status="healthy" if source_result.status == "ok" else ("blocked" if source_result.status == "blocked" else "degraded"), success_rate=1.0 if source_result.status == "ok" else 0.0, latency_ms=source_result.elapsed_ms, items_per_run=len(source_records), fields_completeness=complete, schema_drift=(source_result.status == "ok" and not source_records), last_success=datetime.now(timezone.utc) if source_result.status == "ok" else None, last_failure=datetime.now(timezone.utc) if source_result.status != "ok" else None, error=source_result.error))
    result = V2RunResult(run_id=run_id, snapshot_id=snapshot_id, source_health=source_health, records=records, signals=signals, insights=insights, changes=changes + [{"type": "DUPLICATE", "record_id": item, "evidence_id": item} for item in duplicate_ids])
    _save_v2(db_path, result)
    return result
