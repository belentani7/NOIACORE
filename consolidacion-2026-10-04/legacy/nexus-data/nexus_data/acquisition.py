from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

import httpx

from .extractor import DomainLimiter, normalize_payload
from .models import SourceConfig, SourceResult
from .v2_models import CompliancePolicy, RawRecord

LOGGER = logging.getLogger(__name__)


class ComplianceError(RuntimeError):
    """The source is not approved for acquisition."""


@dataclass(frozen=True)
class AcquisitionRequest:
    source: SourceConfig
    job_id: str
    snapshot_id: str


class ComplianceFirewall:
    def __init__(self, policy: CompliancePolicy) -> None:
        self.policy = policy

    def validate(self, source: SourceConfig) -> None:
        parsed = urlparse(source.endpoint)
        domain = (parsed.hostname or source.domain).lower()
        if parsed.scheme not in {"http", "https"}:
            raise ComplianceError("only http/https URLs are permitted")
        if domain in self.policy.blocked_domains:
            raise ComplianceError(f"blocked domain: {domain}")
        if self.policy.allowed_domains and domain not in self.policy.allowed_domains:
            raise ComplianceError(f"domain not approved: {domain}")
        if source.rate_limit_seconds < self.policy.min_interval_seconds:
            raise ComplianceError("configured rate limit is below policy minimum")
        if not source.allowed:
            raise ComplianceError("source disabled by policy")


class AcquisitionProvider(ABC):
    name: str

    @abstractmethod
    async def acquire(self, request: AcquisitionRequest) -> tuple[SourceResult, list[RawRecord]]:
        raise NotImplementedError


class HttpxProvider(AcquisitionProvider):
    name = "httpx"

    def __init__(self, policy: CompliancePolicy, client: httpx.AsyncClient | None = None) -> None:
        self.firewall = ComplianceFirewall(policy)
        self.policy = policy
        self.limiter = DomainLimiter(policy.min_interval_seconds)
        self._external_client = client
        self.client = client or httpx.AsyncClient(follow_redirects=True)
        self.client.headers.update({"User-Agent": policy.user_agent, "Accept": "application/json"})

    async def close(self) -> None:
        if self._external_client is None:
            await self.client.aclose()

    async def acquire(self, request: AcquisitionRequest) -> tuple[SourceResult, list[RawRecord]]:
        source = request.source
        started = time.perf_counter()
        try:
            self.firewall.validate(source)
        except ComplianceError as exc:
            result = SourceResult(source=source.name, status="blocked", error=str(exc))
            return result, []

        attempts = 0
        last_error: str | None = None
        status: int | None = None
        for attempt in range(source.max_retries + 1):
            attempts = attempt + 1
            try:
                await self.limiter.wait(source.domain, source.rate_limit_seconds)
                response = await self.client.request(source.method, source.endpoint, params=source.params, timeout=source.timeout_seconds)
                status = response.status_code
                if response.status_code == 200:
                    payload = response.json()
                    rows = normalize_payload(source.name, payload)
                    raw = [self._raw_record(row, source, request) for row in rows]
                    return SourceResult(source=source.name, status="ok", records=rows, attempts=attempts,
                                        elapsed_ms=(time.perf_counter() - started) * 1000, http_status=status), raw
                if response.status_code in {401, 403, 404}:
                    last_error = f"non-retryable HTTP {response.status_code}"
                    break
                last_error = f"transient HTTP {response.status_code}"
            except (httpx.HTTPError, ValueError, json.JSONDecodeError) as exc:
                last_error = f"{type(exc).__name__}: {exc}"
            if attempt < source.max_retries:
                await asyncio.sleep(min(30.0, 2**attempt))

        LOGGER.warning("acquisition_failed", extra={"source": source.name, "error": last_error})
        return SourceResult(source=source.name, status="error", error=last_error, attempts=attempts,
                            elapsed_ms=(time.perf_counter() - started) * 1000, http_status=status), []

    @staticmethod
    def _raw_record(row: dict[str, Any], source: SourceConfig, request: AcquisitionRequest) -> RawRecord:
        source_id = str(row.get("source_id") or row.get("id") or row.get("url") or hashlib.sha256(json.dumps(row, sort_keys=True).encode()).hexdigest())
        record_id = hashlib.sha256(f"{source.name}:{source_id}".encode()).hexdigest()
        lineage = {
            "source": source.name,
            "url": str(row.get("source_url") or source.endpoint),
            "extraction_job_id": request.job_id,
            "raw_record_id": record_id,
            "snapshot_id": request.snapshot_id,
        }
        from .v2_models import Lineage
        return RawRecord(record_id=record_id, source=source.name, source_url=lineage["url"], payload=row, lineage=Lineage(**lineage))


class APIProvider(HttpxProvider):
    name = "official_api"


class CustomYamlProvider(HttpxProvider):
    name = "yaml_http"


class ExternalProviderUnavailable(AcquisitionProvider):
    """Explicit opt-in boundary for external Crawlee/Firecrawl/Crawl4AI deployments."""

    def __init__(self, provider_name: str) -> None:
        self.name = provider_name

    async def acquire(self, request: AcquisitionRequest) -> tuple[SourceResult, list[RawRecord]]:
        message = f"provider '{self.name}' is not enabled; configure its legal external endpoint explicitly"
        return SourceResult(source=request.source.name, status="unavailable", error=message), []


class AcquisitionBus:
    def __init__(self, providers: dict[str, AcquisitionProvider], default_provider: str = "official_api") -> None:
        self.providers = providers
        self.default_provider = default_provider

    async def run(self, requests: list[AcquisitionRequest], provider_by_source: dict[str, str] | None = None) -> tuple[list[SourceResult], list[RawRecord]]:
        provider_by_source = provider_by_source or {}
        async def one(request: AcquisitionRequest) -> tuple[SourceResult, list[RawRecord]]:
            provider_name = provider_by_source.get(request.source.name, self.default_provider)
            provider = self.providers[provider_name]
            return await provider.acquire(request)
        pairs = await asyncio.gather(*(one(request) for request in requests))
        results = [pair[0] for pair in pairs]
        raws = [raw for _, rows in pairs for raw in rows]
        return results, raws

    async def close(self) -> None:
        for provider in self.providers.values():
            close = getattr(provider, "close", None)
            if close is not None:
                await close()
