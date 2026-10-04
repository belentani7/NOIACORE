from __future__ import annotations

from datetime import datetime, timezone

import httpx
import pytest

from nexus_data.acquisition import APIProvider, AcquisitionBus, AcquisitionRequest
from nexus_data.models import SourceConfig
from nexus_data.v2_models import CompliancePolicy, Lineage, RawRecord
from nexus_data.intelligence_v2 import build_insights, build_signals, detect_changes, deduplicate, jobs_niche, normalize_records


def _source() -> SourceConfig:
    return SourceConfig(name="Demo", endpoint="https://demo.example/api", domain="demo.example", rate_limit_seconds=2.0)


def _raw(record_id: str, title: str = "Senior Python Engineer") -> RawRecord:
    now = datetime.now(timezone.utc)
    lineage = Lineage(source="Demo", url="https://demo.example/job", extraction_job_id="run", raw_record_id=record_id, snapshot_id="snap")
    return RawRecord(record_id=record_id, source="Demo", source_url=lineage.url, payload={"source_id": record_id, "title": title, "company": "Acme", "skills": ["python"], "remote": True, "salary_min": 60000, "salary_max": 80000}, observed_at=now, lineage=lineage)


def test_v2_lineage_quality_signals_and_insights() -> None:
    records = normalize_records([_raw("1")], jobs_niche())
    assert records[0].lineage.raw_record_id == "1"
    assert records[0].dq_score > 0.7
    signals = build_signals(records, [])
    insights = build_insights(records, signals, [])
    assert signals
    assert insights[0].evidence_ids == ["1"]


def test_v2_dedup_and_change_detection() -> None:
    records = normalize_records([_raw("1"), _raw("2")], jobs_niche())
    unique, duplicates = deduplicate(records)
    assert len(unique) == 1
    assert len(duplicates) == 1
    changed = normalize_records([_raw("3", title="Staff Python Engineer")], jobs_niche())
    changes = detect_changes(changed, unique)
    assert any(item["type"] in {"NEW", "CHANGED", "REMOVED"} for item in changes)


@pytest.mark.asyncio
async def test_v2_provider_compliance_and_raw_lineage() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["User-Agent"].startswith("NexusDataBot/")
        return httpx.Response(200, json={"data": [{"id": "1", "title": "Engineer", "url": "https://demo.example/1"}]})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        policy = CompliancePolicy(allowed_domains={"demo.example"})
        provider = APIProvider(policy, client=client)
        bus = AcquisitionBus({"official_api": provider})
        results, raw = await bus.run([AcquisitionRequest(_source(), "run", "snap")])
        await bus.close()
    assert results[0].status == "ok"
    assert raw[0].lineage.snapshot_id == "snap"
