from __future__ import annotations

import asyncio
import json
import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from .analysis import build_report, llm_report
from .cleaning import clean_records
from .extractor import GenericExtractor
from .models import RunResult, SourcesConfig

LOGGER = logging.getLogger("nexus_data")


def load_config(path: str | Path) -> SourcesConfig:
    with open(path, "r", encoding="utf-8") as handle:
        return SourcesConfig.model_validate(yaml.safe_load(handle))


def init_db(path: str | Path) -> None:
    with sqlite3.connect(path) as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS jobs (
            source TEXT NOT NULL, source_id TEXT NOT NULL, source_url TEXT NOT NULL,
            title TEXT NOT NULL, company TEXT, description TEXT, location TEXT,
            remote INTEGER, employment_type TEXT, seniority TEXT, skills_json TEXT,
            salary_min REAL, salary_max REAL, salary_currency TEXT, salary_period TEXT,
            published_at TEXT, ingested_at TEXT NOT NULL, attribution_required INTEGER,
            raw_hash TEXT NOT NULL, PRIMARY KEY (source, source_id)
        );
        CREATE TABLE IF NOT EXISTS runs (
            run_id INTEGER PRIMARY KEY AUTOINCREMENT, started_at TEXT, finished_at TEXT,
            raw_records INTEGER, valid_records INTEGER, duplicate_records INTEGER,
            report_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS source_metrics (
            run_id INTEGER, source TEXT, status TEXT, attempts INTEGER,
            elapsed_ms REAL, http_status INTEGER, error TEXT
        );
        """)


def save_run(path: str | Path, result: RunResult) -> int:
    with sqlite3.connect(path) as conn:
        cursor = conn.execute(
            "INSERT INTO runs (started_at, finished_at, raw_records, valid_records, duplicate_records, report_json) VALUES (?, ?, ?, ?, ?, ?)",
            (result.started_at.isoformat(), result.finished_at.isoformat(), result.raw_records, result.valid_records,
             result.duplicate_records, json.dumps(result.report, ensure_ascii=False)),
        )
        run_id = int(cursor.lastrowid)
        for source in result.source_results:
            conn.execute(
                "INSERT INTO source_metrics VALUES (?, ?, ?, ?, ?, ?, ?)",
                (run_id, source.source, source.status, source.attempts, source.elapsed_ms, source.http_status, source.error),
            )
        for record in result.records:
            conn.execute(
                "INSERT OR REPLACE INTO jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (record.source, record.source_id, record.source_url, record.title, record.company, record.description,
                 record.location, int(record.remote) if record.remote is not None else None, record.employment_type,
                 record.seniority, json.dumps(record.skills), record.salary_min, record.salary_max,
                 record.salary_currency, record.salary_period, record.published_at.isoformat() if record.published_at else None,
                 record.ingested_at.isoformat(), int(record.attribution_required), record.raw_hash),
            )
    return run_id


async def run_pipeline(config_path: str | Path, db_path: str | Path = "nexus.db") -> RunResult:
    config = load_config(config_path)
    init_db(db_path)
    started = datetime.now(timezone.utc)
    async with GenericExtractor(config) as extractor:
        source_results = await extractor.run()
    raw_records = [row for source in source_results for row in source.records]
    records, duplicates = clean_records(raw_records)
    report = build_report(records, duplicates)
    report["llm_report"] = llm_report(report)
    result = RunResult(
        started_at=started, finished_at=datetime.now(timezone.utc), raw_records=len(raw_records),
        valid_records=len(records), duplicate_records=duplicates, records=records,
        source_results=source_results, report=report,
    )
    save_run(db_path, result)
    LOGGER.info("pipeline_completed", extra={"raw_records": len(raw_records), "valid_records": len(records), "duplicates": duplicates})
    return result


def run_sync(config_path: str | Path, db_path: str | Path = "nexus.db") -> RunResult:
    return asyncio.run(run_pipeline(config_path, db_path))
