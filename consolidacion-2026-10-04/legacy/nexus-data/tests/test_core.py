from __future__ import annotations

import httpx
import pytest

from nexus_data.cleaning import clean_html, clean_records, infer_seniority
from nexus_data.extractor import GenericExtractor, normalize_payload
from nexus_data.models import SourceConfig, SourcesConfig


def test_clean_html_and_seniority() -> None:
    assert clean_html("<p>Senior <b>Python</b> engineer</p>") == "Senior Python engineer"
    assert infer_seniority("", "We need a senior backend engineer") == "senior"


def test_clean_records_deduplicates_and_detects_skills() -> None:
    rows = [
        {"source": "A", "source_id": "1", "source_url": "https://a/1", "title": "Senior Python Engineer", "company": "Acme", "description": "Python SQL AWS", "raw_hash": "x"},
        {"source": "A", "source_id": "1", "source_url": "https://a/1", "title": "Senior Python Engineer", "company": "Acme", "description": "Python SQL AWS", "raw_hash": "x"},
    ]
    records, duplicates = clean_records(rows)
    assert len(records) == 1
    assert duplicates == 1
    assert records[0].seniority == "senior"
    assert set(records[0].skills) >= {"python", "sql", "aws"}


def test_normalize_payload_jobicy() -> None:
    payload = {"jobs": [{"id": 7, "url": "https://jobicy.com/7", "jobTitle": "Data Engineer", "companyName": "Acme", "jobDescription": "Python", "jobType": ["Full-Time"], "jobIndustry": ["engineering"]}]}
    rows = normalize_payload("Jobicy", payload)
    assert rows[0]["source_id"] == "7"
    assert rows[0]["title"] == "Data Engineer"


@pytest.mark.asyncio
async def test_extractor_success_and_user_agent() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["User-Agent"].startswith("NexusDataTest/")
        return httpx.Response(200, json={"jobs": []})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        config = SourcesConfig(user_agent="NexusDataTest/1.0", sources=[SourceConfig(name="Remotive", endpoint="https://remotive.com/api/remote-jobs", domain="remotive.com")])
        async with GenericExtractor(config, client=client) as extractor:
            result = await extractor.run()
    assert result[0].status == "ok"
    assert result[0].records == []
