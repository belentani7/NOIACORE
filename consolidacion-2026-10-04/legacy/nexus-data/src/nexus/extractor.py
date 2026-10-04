from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import secrets
import time
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Self
from urllib.parse import quote, urlparse

import httpx
import yaml

logger = logging.getLogger("nexus.extractor")


@dataclass
class RawRecord:
    source: str
    source_id: str
    payload: dict[str, Any]
    source_url: str
    retrieved_at: str
    raw_payload_hash: str
    demo: bool = False
    data_origin: str = "official_api"


class DomainLimiter:
    def __init__(self, default_interval: float = 2.0):
        self.default_interval = max(0.0, default_interval)
        self._last: dict[str, float] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self._guard = asyncio.Lock()

    async def _lock_for(self, domain: str) -> asyncio.Lock:
        async with self._guard:
            return self._locks.setdefault(domain, asyncio.Lock())

    async def wait(self, domain: str, interval: float | None = None) -> None:
        lock = await self._lock_for(domain)
        async with lock:
            gap = interval if interval is not None else self.default_interval
            delay = gap - (time.monotonic() - self._last.get(domain, 0.0))
            if delay > 0:
                await asyncio.sleep(delay)
            self._last[domain] = time.monotonic()


class GenericExtractor:
    def __init__(self, config_path: str | Path):
        self.config = yaml.safe_load(Path(config_path).read_text(encoding="utf-8")) or {}
        settings = self.config.get("settings", {})
        self.user_agent = str(settings.get("user_agent", "")).strip()
        if not self.user_agent or "example.invalid" in self.user_agent:
            raise ValueError("settings.user_agent debe identificar NEXUS DATA y un canal de contacto válido")
        self.timeout = float(settings.get("timeout_seconds", 20))
        self.max_retries = int(settings.get("max_retries", 3))
        self.demo_mode = bool(settings.get("demo_mode", False))
        self.limiter = DomainLimiter(float(settings.get("default_rate_limit_seconds", 2.0)))
        limits = httpx.Limits(max_connections=int(settings.get("max_connections", 8)), max_keepalive_connections=4)
        self.client = httpx.AsyncClient(follow_redirects=True, timeout=self.timeout, limits=limits)
        self.source_metrics: dict[str, dict[str, Any]] = {}

    async def close(self) -> None:
        await self.client.aclose()

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()

    @staticmethod
    def _path(obj: Any, path: str | None) -> Any:
        if not path:
            return obj
        for part in path.split("."):
            if isinstance(obj, dict):
                obj = obj.get(part)
            else:
                return None
        return obj

    @staticmethod
    def _dynamic(value: Any) -> Any:
        if isinstance(value, dict):
            return {key: GenericExtractor._dynamic(item) for key, item in value.items()}
        if isinstance(value, list):
            return [GenericExtractor._dynamic(item) for item in value]
        if not isinstance(value, str):
            return value
        today = datetime.now(UTC).date()
        if value == "{{today}}":
            return today.isoformat()
        if value.startswith("{{days_ago:") and value.endswith("}}"):
            try:
                return (today - timedelta(days=int(value[11:-2]))).isoformat()
            except ValueError:
                return value
        return value

    def _validate_source(self, source: dict[str, Any]) -> None:
        required = ("name", "url", "id_field")
        missing = [key for key in required if not source.get(key)]
        if missing:
            raise ValueError(f"Fuente mal configurada ({source.get('name', 'sin nombre')}): faltan {', '.join(missing)}")
        if float(source.get("rate_limit_seconds", self.limiter.default_interval)) < 2.0:
            raise ValueError(f"La fuente {source['name']} incumple el intervalo mínimo de 2 segundos por dominio")

    async def _request(self, source: dict[str, Any]) -> tuple[Any, int]:
        self._validate_source(source)
        url = source["url"]
        domain = source.get("domain") or urlparse(url).netloc
        interval = float(source.get("rate_limit_seconds", self.limiter.default_interval))
        method = source.get("method", "GET").upper()
        headers = {"User-Agent": self.user_agent, "Accept": "application/json"}
        request_kwargs: dict[str, Any] = {"json": self._dynamic(source.get("body", {}))} if method == "POST" else {"params": self._dynamic(source.get("params", {}))}
        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            await self.limiter.wait(domain, interval)
            try:
                response = await self.client.request(method, url, headers=headers, **request_kwargs)
                if response.status_code == 429:
                    retry_after = min(float(response.headers.get("Retry-After", "2")), 60.0)
                    await asyncio.sleep(retry_after)
                    raise httpx.HTTPStatusError("rate limited", request=response.request, response=response)
                response.raise_for_status()
                return response.json(), attempt + 1
            except (httpx.HTTPError, ValueError) as exc:
                last_error = exc
                logger.warning(json.dumps({"event": "request_error", "source": source["name"], "attempt": attempt + 1, "error": str(exc)}))
                if attempt < self.max_retries:
                    await asyncio.sleep(min(30, 2**attempt) + secrets.randbelow(250) / 1000)
        raise RuntimeError(f"Fuente {source['name']} falló tras reintentos: {last_error}")

    def _fixture(self, source: dict[str, Any]) -> list[RawRecord]:
        now = datetime.now(UTC).isoformat()
        country = source.get("country", "XX")
        rows = [
            {"id": f"{source['name']}-001", "title": "[DEMO] Cloud data platform and analytics services", "buyer": "Demo Ministry of Digital Services", "deadline": "2026-09-15", "amount": "250000", "country": country, "category": "IT", "description": "Synthetic fixture for local testing; not a live opportunity.", "url": source["url"]},
            {"id": f"{source['name']}-002", "title": "[DEMO] Cybersecurity monitoring and incident response", "buyer": "Demo City Technology Office", "deadline": "2026-08-30", "amount": "85000", "country": country, "category": "SECURITY", "description": "Synthetic fixture for local testing; not a live opportunity.", "url": source["url"]},
            {"id": f"{source['name']}-003", "title": "[DEMO] Open data portal modernization", "buyer": "Demo Regional Procurement Authority", "deadline": "2026-10-20", "amount": "420000", "country": country, "category": "DATA", "description": "Synthetic fixture for local testing; not a live opportunity.", "url": source["url"]},
        ]
        return [RawRecord(source["name"], row["id"], row, row["url"], now, hashlib.sha256(json.dumps(row, sort_keys=True).encode()).hexdigest(), True, "synthetic_demo") for row in rows]

    def _source_url(self, source: dict[str, Any], item: dict[str, Any], source_id: str) -> str:
        template = source.get("source_url_template")
        if not template:
            return source["url"]
        values = {"source_id": quote(source_id, safe=""), "id": quote(source_id, safe="")}
        for key, value in item.items():
            if isinstance(value, (str, int, float)):
                values[key] = quote(str(value), safe="")
        try:
            return str(template).format(**values)
        except KeyError:
            return source["url"]

    async def fetch_source(self, source: dict[str, Any]) -> tuple[list[RawRecord], int, int]:
        started = time.monotonic()
        if self.demo_mode:
            logger.info(json.dumps({"event": "synthetic_demo_fixture", "source": source["name"]}))
            return self._fixture(source), 0, round((time.monotonic() - started) * 1000)
        required = source.get("requires_env")
        if required and not os.getenv(required):
            raise RuntimeError(f"Fuente {source['name']} requiere {required}; no se permite fallback silencioso a demo")
        data, attempts = await self._request(source)
        items = self._path(data, source.get("item_path")) or []
        if not isinstance(items, list):
            raise TypeError(f"item_path de {source['name']} no resolvió una lista")
        now = datetime.now(UTC).isoformat()
        records: list[RawRecord] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            source_id = str(self._path(item, source["id_field"]) or hashlib.sha256(json.dumps(item, sort_keys=True).encode()).hexdigest()[:16])
            raw_hash = hashlib.sha256(json.dumps(item, sort_keys=True, default=str).encode()).hexdigest()
            records.append(RawRecord(source["name"], source_id, item, self._source_url(source, item, source_id), now, raw_hash))
        return records, attempts, round((time.monotonic() - started) * 1000)

    async def run(self, names: list[str] | None = None) -> list[RawRecord]:
        selected = [source for source in self.config.get("sources", []) if source.get("enabled", True) and (not names or source["name"] in names)]
        if names and len(selected) != len(set(names)):
            known = {source["name"] for source in selected}
            raise ValueError(f"Fuentes no configuradas: {', '.join(sorted(set(names) - known))}")
        try:
            results = await asyncio.gather(*(self.fetch_source(source) for source in selected), return_exceptions=True)
            records: list[RawRecord] = []
            for source, result in zip(selected, results):
                if isinstance(result, Exception):
                    self.source_metrics[source["name"]] = {"status": "error", "received": 0, "attempts": 0, "latency_ms": 0, "error": str(result)}
                    logger.error(json.dumps({"event": "source_failed", "source": source["name"], "error": str(result)}))
                else:
                    source_records, attempts, latency_ms = result
                    self.source_metrics[source["name"]] = {"status": "success", "received": len(source_records), "attempts": attempts, "latency_ms": latency_ms, "error": None}
                    records.extend(source_records)
            return records
        finally:
            await self.close()
