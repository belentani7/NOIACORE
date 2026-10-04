from __future__ import annotations

import asyncio
import csv
import hashlib
import json
import logging
import sqlite3
from pathlib import Path
from typing import Any

import yaml

from .analysis import analyze, report
from .cleaning import clean_records
from .extractor import GenericExtractor
from .intelligence import enrich_with_llm

logger = logging.getLogger("nexus.pipeline")


class Pipeline:
    def __init__(self, config_path: str = "config/sources.yml", db_path: str = "data/nexus.db"):
        self.config_path = Path(config_path)
        self.db_path = Path(db_path)
        self.config = yaml.safe_load(self.config_path.read_text(encoding="utf-8")) or {}
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    def init_db(self) -> None:
        with sqlite3.connect(self.db_path) as con:
            con.execute("PRAGMA journal_mode=WAL")
            con.execute("PRAGMA foreign_keys=ON")
            con.execute("CREATE TABLE IF NOT EXISTS opportunities (source TEXT, source_id TEXT, title TEXT, buyer TEXT, deadline TEXT, published_date TEXT, amount REAL, currency TEXT, country TEXT, category TEXT, description TEXT, source_url TEXT, record_type TEXT, retrieved_at TEXT, raw_payload_hash TEXT, data_origin TEXT, is_valid INTEGER, quality_flags TEXT, dedupe_key TEXT, days_to_deadline INTEGER, urgency TEXT, sme_fit INTEGER, score_reasons TEXT, amount_anomaly INTEGER, intelligence_json TEXT, run_id INTEGER, PRIMARY KEY(source, source_id))")
            con.execute("CREATE TABLE IF NOT EXISTS runs (run_id INTEGER PRIMARY KEY AUTOINCREMENT, started_at TEXT DEFAULT CURRENT_TIMESTAMP, total INTEGER, config_hash TEXT, report TEXT)")
            con.execute("CREATE TABLE IF NOT EXISTS source_metrics (run_id INTEGER, source TEXT, received INTEGER, valid INTEGER, invalid INTEGER, duplicates INTEGER, status TEXT, attempts INTEGER, latency_ms INTEGER, error TEXT, PRIMARY KEY(run_id, source))")
            self._migrate(con, "opportunities", {"published_date": "TEXT", "currency": "TEXT", "record_type": "TEXT", "dedupe_key": "TEXT", "score_reasons": "TEXT", "intelligence_json": "TEXT"})
            self._migrate(con, "runs", {"config_hash": "TEXT"})
            self._migrate(con, "source_metrics", {"attempts": "INTEGER", "latency_ms": "INTEGER"})

    @staticmethod
    def _migrate(con: sqlite3.Connection, table: str, columns: dict[str, str]) -> None:
        existing = {row[1] for row in con.execute(f"PRAGMA table_info({table})")}
        for name, kind in columns.items():
            if name not in existing:
                con.execute(f"ALTER TABLE {table} ADD COLUMN {name} {kind}")

    async def run_async(self, names: list[str] | None = None) -> tuple[list[dict[str, Any]], dict[str, Any], str]:
        self.init_db()
        extractor = GenericExtractor(self.config_path)
        raw = await extractor.run(names)
        rows, metrics = clean_records(raw, self.config.get("sources", []))
        source_metrics = extractor.source_metrics
        for source_name, source_metric in source_metrics.items():
            source_rows = [row for row in rows if row["source"] == source_name]
            source_metric["valid"] = sum(bool(row["is_valid"]) for row in source_rows)
            source_metric["invalid"] = sum(not bool(row["is_valid"]) for row in source_rows)
            source_metric["duplicates"] = max(0, source_metric["received"] - len(source_rows))
        rows = enrich_with_llm(rows)
        analysis = analyze(rows)
        text = report(analysis)
        config_hash = hashlib.sha256(self.config_path.read_bytes()).hexdigest()
        with sqlite3.connect(self.db_path) as con:
            cur = con.execute("INSERT INTO runs(total, config_hash, report) VALUES (?,?,?)", (len(rows), config_hash, text))
            run_id = cur.lastrowid
            columns = ["source", "source_id", "title", "buyer", "deadline", "published_date", "amount", "currency", "country", "category", "description", "source_url", "record_type", "retrieved_at", "raw_payload_hash", "data_origin", "is_valid", "quality_flags", "dedupe_key", "days_to_deadline", "urgency", "sme_fit", "score_reasons", "amount_anomaly", "intelligence_json", "run_id"]
            placeholders = ",".join("?" for _ in columns)
            for row in rows:
                row["score_reasons"] = json.dumps(row.get("score_reasons", []), ensure_ascii=False)
                row["intelligence_json"] = json.dumps(row.get("intelligence", {}), ensure_ascii=False)
                row["run_id"] = run_id
                con.execute(f"INSERT OR REPLACE INTO opportunities ({','.join(columns)}) VALUES ({placeholders})", tuple(row.get(key) for key in columns))
            for source_name, source_metric in source_metrics.items():
                con.execute("INSERT OR REPLACE INTO source_metrics(run_id, source, received, valid, invalid, duplicates, status, attempts, latency_ms, error) VALUES (?,?,?,?,?,?,?,?,?,?)", (run_id, source_name, source_metric["received"], source_metric["valid"], source_metric["invalid"], source_metric["duplicates"], source_metric["status"], source_metric.get("attempts", 0), source_metric.get("latency_ms", 0), source_metric["error"]))
            con.commit()
        logger.info(json.dumps({"event": "pipeline_complete", "run_id": run_id, "records": len(rows), "sources": source_metrics}))
        return rows, {**metrics, **analysis, "run_id": run_id, "source_metrics": source_metrics, "config_hash": config_hash}, text

    def run(self, names: list[str] | None = None) -> tuple[list[dict[str, Any]], dict[str, Any], str]:
        return asyncio.run(self.run_async(names))

    def healthcheck(self) -> dict[str, Any]:
        self.init_db()
        return {"status": "ok", "config": str(self.config_path), "database": str(self.db_path), "configured_sources": [source["name"] for source in self.config.get("sources", []) if source.get("enabled", True)]}

    def latest_source_metrics(self) -> list[dict[str, Any]]:
        self.init_db()
        with sqlite3.connect(self.db_path) as con:
            con.row_factory = sqlite3.Row
            row = con.execute("SELECT MAX(run_id) AS run_id FROM source_metrics").fetchone()
            if not row or row["run_id"] is None:
                return []
            return [dict(record) for record in con.execute("SELECT source, received, valid, invalid, duplicates, status, attempts, latency_ms, error FROM source_metrics WHERE run_id=? ORDER BY source", (row["run_id"],))]


def export_rows(rows: list[dict[str, Any]], out_dir: str = "data/processed") -> tuple[Path, Path]:
    target = Path(out_dir)
    target.mkdir(parents=True, exist_ok=True)
    csv_path, json_path = target / "opportunities.csv", target / "opportunities.json"
    fieldnames = sorted({key for row in rows for key in row}) if rows else []
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        if fieldnames:
            writer = csv.DictWriter(handle, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    json_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    return csv_path, json_path
