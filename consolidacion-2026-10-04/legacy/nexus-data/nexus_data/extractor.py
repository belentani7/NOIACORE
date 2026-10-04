from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import random
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import httpx

from .models import SourceConfig, SourceResult, SourcesConfig

LOGGER = logging.getLogger(__name__)


class DomainLimiter:
    def __init__(self, default_seconds: float = 2.0) -> None:
        self.default_seconds = default_seconds
        self._last: dict[str, float] = defaultdict(float)
        self._locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

    async def wait(self, domain: str, seconds: float | None = None) -> None:
        delay = max(self.default_seconds, seconds or self.default_seconds)
        async with self._locks[domain]:
            elapsed = time.monotonic() - self._last[domain]
            if elapsed < delay:
                await asyncio.sleep(delay - elapsed)
            self._last[domain] = time.monotonic()


class GenericExtractor:
    def __init__(self, config: SourcesConfig, client: httpx.AsyncClient | None = None) -> None:
        self.config = config
        self.limiter = DomainLimiter()
        self._external_client = client
        self.client = client or httpx.AsyncClient(
            headers={"User-Agent": config.user_agent, "Accept": "application/json"},
            follow_redirects=True,
        )
        # En integraciones y tests, el cliente puede venir inyectado; el identificador
        # debe prevalecer siempre para cumplir la política de transparencia.
        self.client.headers.update({"User-Agent": config.user_agent, "Accept": "application/json"})

    async def __aenter__(self) -> "GenericExtractor":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()

    async def close(self) -> None:
        if self._external_client is None:
            await self.client.aclose()

    async def run(self) -> list[SourceResult]:
        tasks = [asyncio.create_task(self.fetch_source(source)) for source in self.config.sources if source.allowed]
        return await asyncio.gather(*tasks)

    async def fetch_source(self, source: SourceConfig) -> SourceResult:
        started = time.perf_counter()
        domain = source.domain or urlparse(source.endpoint).netloc
        attempts = 0
        last_error: str | None = None
        status: int | None = None

        for attempt in range(source.max_retries + 1):
            attempts = attempt + 1
            try:
                await self.limiter.wait(domain, source.rate_limit_seconds)
                response = await self.client.request(
                    source.method,
                    source.endpoint,
                    params=source.params,
                    timeout=source.timeout_seconds,
                )
                status = response.status_code
                if response.status_code == 200:
                    payload = response.json()
                    records = normalize_payload(source.name, payload)
                    return SourceResult(
                        source=source.name,
                        status="ok",
                        records=records,
                        attempts=attempts,
                        elapsed_ms=(time.perf_counter() - started) * 1000,
                        http_status=status,
                    )
                if response.status_code in {401, 403, 404}:
                    last_error = f"non-retryable HTTP {response.status_code}"
                    break
                if response.status_code not in {429, *range(500, 600)}:
                    last_error = f"unexpected HTTP {response.status_code}"
                    break
                last_error = f"transient HTTP {response.status_code}"
            except (httpx.HTTPError, ValueError, json.JSONDecodeError) as exc:
                last_error = f"{type(exc).__name__}: {exc}"

            if attempt < source.max_retries:
                await asyncio.sleep(min(30.0, (2**attempt) + random.uniform(0, 0.5)))

        LOGGER.warning("source_failed", extra={"source": source.name, "error": last_error})
        return SourceResult(
            source=source.name,
            status="error",
            error=last_error,
            attempts=attempts,
            elapsed_ms=(time.perf_counter() - started) * 1000,
            http_status=status,
        )


def normalize_payload(source: str, payload: Any) -> list[dict[str, Any]]:
    if source.lower() == "remotive":
        return [_remotive_row(row) for row in payload.get("jobs", [])]
    if source.lower() == "arbeitnow":
        return [_arbeitnow_row(row) for row in payload.get("data", [])]
    if source.lower() == "jobicy":
        return [_jobicy_row(row) for row in payload.get("jobs", [])]
    if isinstance(payload, list):
        return [dict(row) for row in payload if isinstance(row, dict)]
    if isinstance(payload, dict) and isinstance(payload.get("data"), list):
        return [dict(row) for row in payload["data"] if isinstance(row, dict)]
    return []


def _common_hash(source: str, source_id: Any, title: Any, company: Any) -> str:
    raw = f"{source}|{source_id}|{title}|{company}".encode("utf-8", "ignore")
    return hashlib.sha256(raw).hexdigest()


def _remotive_row(row: dict[str, Any]) -> dict[str, Any]:
    source_id = row.get("id") or row.get("url")
    return {
        "source": "Remotive", "source_id": str(source_id), "source_url": row.get("url", ""),
        "title": row.get("title", ""), "company": row.get("company_name"),
        "description": row.get("description", ""), "location": row.get("candidate_required_location"),
        "remote": True, "employment_type": row.get("job_type"), "published_at": row.get("publication_date"),
        "salary_min": None, "salary_max": None, "salary_currency": None, "salary_period": None,
        "raw_hash": _common_hash("Remotive", source_id, row.get("title"), row.get("company_name")),
        "attribution_required": True,
    }


def _arbeitnow_row(row: dict[str, Any]) -> dict[str, Any]:
    source_id = row.get("slug") or row.get("url") or row.get("id")
    tags = row.get("tags") or []
    return {
        "source": "Arbeitnow", "source_id": str(source_id), "source_url": row.get("url", ""),
        "title": row.get("title", ""), "company": row.get("company_name") or row.get("company"),
        "description": row.get("description", ""), "location": row.get("location"),
        "remote": row.get("remote"), "employment_type": row.get("job_types") or row.get("job_type"),
        "published_at": row.get("created_at"), "skills": tags if isinstance(tags, list) else [],
        "salary_min": None, "salary_max": None, "salary_currency": None, "salary_period": None,
        "raw_hash": _common_hash("Arbeitnow", source_id, row.get("title"), row.get("company_name")),
        "attribution_required": False,
    }


def _jobicy_row(row: dict[str, Any]) -> dict[str, Any]:
    source_id = row.get("id") or row.get("jobSlug") or row.get("url")
    salary_min = _as_float(row.get("salaryMin"))
    salary_max = _as_float(row.get("salaryMax"))
    return {
        "source": "Jobicy", "source_id": str(source_id), "source_url": row.get("url", ""),
        "title": row.get("jobTitle", ""), "company": row.get("companyName"),
        "description": row.get("jobDescription") or row.get("jobExcerpt", ""),
        "location": row.get("jobGeo"), "remote": True, "employment_type": _join(row.get("jobType")),
        "seniority": row.get("jobLevel"), "skills": _join_list(row.get("jobIndustry")),
        "salary_min": salary_min, "salary_max": salary_max, "salary_currency": row.get("salaryCurrency"),
        "salary_period": row.get("salaryPeriod"), "published_at": row.get("pubDate"),
        "raw_hash": _common_hash("Jobicy", source_id, row.get("jobTitle"), row.get("companyName")),
        "attribution_required": True,
    }


def _as_float(value: Any) -> float | None:
    try:
        return float(value) if value is not None and value != "" else None
    except (TypeError, ValueError):
        return None


def _join(value: Any) -> str | None:
    if isinstance(value, list):
        return ", ".join(str(x) for x in value)
    return str(value) if value else None


def _join_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(x) for x in value]
    return [str(value)] if value else []
