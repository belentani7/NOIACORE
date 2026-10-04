from __future__ import annotations

import asyncio
import json
import logging
import random
import sqlite3
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Awaitable, Callable
from urllib.parse import urlparse

from .metrics import MetricsRegistry

LOGGER = logging.getLogger("nexus_data.automation")


@dataclass(frozen=True)
class Job:
    job_id: str
    source: str
    endpoint: str
    payload: dict
    domain: str
    attempts: int = 0


class PersistentJobStore:
    """Estado mínimo durable; se reemplaza por PostgreSQL en producción."""

    def __init__(self, path: str = "nexus.db") -> None:
        self.path = path
        with sqlite3.connect(path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS automation_jobs (
                    job_id TEXT PRIMARY KEY, source TEXT NOT NULL, endpoint TEXT NOT NULL,
                    payload_json TEXT NOT NULL, domain TEXT NOT NULL, status TEXT NOT NULL,
                    attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                )
            """)

    def enqueue(self, source: str, endpoint: str, payload: dict) -> str:
        job_id = str(uuid.uuid4())
        domain = urlparse(endpoint).netloc
        now = datetime.now(timezone.utc).isoformat()
        with sqlite3.connect(self.path) as conn:
            conn.execute(
                "INSERT INTO automation_jobs VALUES (?, ?, ?, ?, ?, 'queued', 0, NULL, ?, ?)",
                (job_id, source, endpoint, json.dumps(payload, ensure_ascii=False), domain, now, now),
            )
        return job_id

    def claim(self) -> Job | None:
        with sqlite3.connect(self.path) as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT job_id, source, endpoint, payload_json, domain, attempts FROM automation_jobs WHERE status='queued' ORDER BY created_at LIMIT 1"
            ).fetchone()
            if row is None:
                conn.commit()
                return None
            now = datetime.now(timezone.utc).isoformat()
            conn.execute("UPDATE automation_jobs SET status='running', attempts=attempts+1, updated_at=? WHERE job_id=?", (now, row[0]))
            conn.commit()
            return Job(row[0], row[1], row[2], json.loads(row[3]), row[4], row[5] + 1)

    def complete(self, job_id: str) -> None:
        self._set_status(job_id, "completed", None)

    def retry(self, job_id: str, error: str, max_attempts: int) -> None:
        with sqlite3.connect(self.path) as conn:
            row = conn.execute("SELECT attempts FROM automation_jobs WHERE job_id=?", (job_id,)).fetchone()
            status = "queued" if row and row[0] < max_attempts else "dead_letter"
            now = datetime.now(timezone.utc).isoformat()
            conn.execute("UPDATE automation_jobs SET status=?, last_error=?, updated_at=? WHERE job_id=?", (status, error[:1000], now, job_id))

    def _set_status(self, job_id: str, status: str, error: str | None) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with sqlite3.connect(self.path) as conn:
            conn.execute("UPDATE automation_jobs SET status=?, last_error=?, updated_at=? WHERE job_id=?", (status, error, now, job_id))

    def counts(self) -> dict[str, int]:
        with sqlite3.connect(self.path) as conn:
            rows = conn.execute("SELECT status, COUNT(*) FROM automation_jobs GROUP BY status").fetchall()
        return {status: int(count) for status, count in rows}


class DistributedDomainLimiter:
    """Limiter local; en producción se implementa con Redis/PostgreSQL advisory locks."""

    def __init__(self, minimum_interval: float = 2.0) -> None:
        self.minimum_interval = minimum_interval
        self.last_request: dict[str, float] = {}
        self.locks: dict[str, asyncio.Lock] = {}

    async def acquire(self, domain: str, interval: float | None = None) -> None:
        lock = self.locks.setdefault(domain, asyncio.Lock())
        async with lock:
            required = max(self.minimum_interval, interval or self.minimum_interval)
            elapsed = time.monotonic() - self.last_request.get(domain, 0.0)
            if elapsed < required:
                await asyncio.sleep(required - elapsed)
            self.last_request[domain] = time.monotonic()


Handler = Callable[[Job], Awaitable[None]]


class WorkerPool:
    def __init__(self, store: PersistentJobStore, workers: int = 4, max_attempts: int = 3) -> None:
        self.store = store
        self.workers = max(1, workers)
        self.max_attempts = max_attempts
        self.limiter = DistributedDomainLimiter()
        self.stop_event = asyncio.Event()
        self.metrics = MetricsRegistry()

    async def run(self, handler: Handler, idle_rounds: int = 3) -> None:
        idle = 0
        while not self.stop_event.is_set() and idle < idle_rounds:
            jobs = [self.store.claim() for _ in range(self.workers)]
            jobs = [job for job in jobs if job is not None]
            if not jobs:
                idle += 1
                await asyncio.sleep(0.2)
                continue
            idle = 0
            await asyncio.gather(*(self._execute(job, handler) for job in jobs))

    async def _execute(self, job: Job, handler: Handler) -> None:
        try:
            with self.metrics.timer("nexus_job_latency"):
                await self.limiter.acquire(job.domain)
                await handler(job)
            self.store.complete(job.job_id)
            self.metrics.inc("nexus_jobs_completed_total")
        except Exception as exc:  # noqa: BLE001 — la DLQ necesita capturar todo fallo de actividad
            delay = min(60.0, (2 ** max(0, job.attempts - 1)) + random.random())
            self.metrics.inc("nexus_jobs_failed_total")
            self.store.retry(job.job_id, f"{type(exc).__name__}: {exc}", self.max_attempts)
            if job.attempts < self.max_attempts:
                self.metrics.inc("nexus_jobs_retried_total")
            LOGGER.exception("job_failed", extra={"job_id": job.job_id, "source": job.source, "retry_in_seconds": delay})
            if job.attempts < self.max_attempts:
                await asyncio.sleep(delay)

    def stop(self) -> None:
        self.stop_event.set()
