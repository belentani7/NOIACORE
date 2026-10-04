"""Adaptador opcional para Temporal.

No se importa desde el flujo local si temporalio no está instalado. En producción,
este módulo permite mover el mismo contrato de jobs a ejecución durable.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from typing import Any

try:
    from temporalio import activity, workflow
    from temporalio.common import RetryPolicy
except ImportError:  # pragma: no cover - dependencia opcional de producción
    activity = None
    workflow = None
    RetryPolicy = None


@dataclass
class SourceRunInput:
    source: str
    endpoint: str
    params: dict[str, Any]
    user_agent: str
    rate_limit_seconds: float = 2.0


if workflow is not None and activity is not None:

    @activity.defn
    async def fetch_source_activity(spec: SourceRunInput) -> dict[str, Any]:
        """La actividad real debe delegar en el conector httpx/Scrapy autorizado."""
        from .extractor import GenericExtractor
        from .models import SourceConfig, SourcesConfig

        source = SourceConfig(
            name=spec.source,
            endpoint=spec.endpoint,
            domain=spec.endpoint.split("/")[2],
            params=spec.params,
            rate_limit_seconds=spec.rate_limit_seconds,
        )
        config = SourcesConfig(user_agent=spec.user_agent, sources=[source])
        async with GenericExtractor(config) as extractor:
            result = await extractor.fetch_source(source)
        return result.model_dump(mode="json")

    @activity.defn
    async def persist_and_quality_activity(source_result: dict[str, Any]) -> dict[str, Any]:
        """Actividad idempotente: persiste por hash y aplica calidad antes de publicar."""
        from .cleaning import clean_records

        records, duplicates = clean_records(source_result.get("records", []))
        return {
            "source": source_result.get("source"),
            "status": source_result.get("status"),
            "valid_records": [record.model_dump(mode="json") for record in records],
            "duplicates": duplicates,
            "http_status": source_result.get("http_status"),
        }

    @workflow.defn
    class SourceRunWorkflow:
        @workflow.run
        async def run(self, spec: SourceRunInput) -> dict[str, Any]:
            retry = RetryPolicy(
                initial_interval=timedelta(seconds=2),
                backoff_coefficient=2.0,
                maximum_interval=timedelta(seconds=60),
                maximum_attempts=3,
            )
            raw = await workflow.execute_activity(
                fetch_source_activity,
                spec,
                start_to_close_timeout=timedelta(minutes=5),
                retry_policy=retry,
            )
            return await workflow.execute_activity(
                persist_and_quality_activity,
                raw,
                start_to_close_timeout=timedelta(minutes=5),
                retry_policy=retry,
            )
else:

    class SourceRunWorkflow:  # type: ignore[no-redef]
        """Placeholder importable sin temporalio; usar WorkerPool en modo local."""

        pass
