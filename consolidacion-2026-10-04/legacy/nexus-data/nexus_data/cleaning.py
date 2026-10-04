from __future__ import annotations

import hashlib
import re
from collections.abc import Iterable
from datetime import datetime, timezone
from typing import Any

from bs4 import BeautifulSoup

from .models import JobRecord


SKILL_PATTERNS = {
    "python": r"\bpython\b", "sql": r"\bsql\b", "aws": r"\baws\b",
    "azure": r"\bazure\b", "gcp": r"\bgcp\b", "docker": r"\bdocker\b",
    "kubernetes": r"\bkubernetes\b|\bk8s\b", "typescript": r"\btypescript\b",
    "javascript": r"\bjavascript\b|\bjs\b", "react": r"\breact(?:\.js)?\b",
    "data engineering": r"data engineering|data engineer", "machine learning": r"machine learning|\bml\b",
    "terraform": r"\bterraform\b", "snowflake": r"\bsnowflake\b",
}

SENIORITY_PATTERNS = {
    "intern": r"intern|internship|prácticas", "junior": r"junior|entry[- ]level|associate",
    "mid": r"mid[- ]level|intermediate", "senior": r"senior|sr\.?|lead|principal|staff",
    "manager": r"manager|head of|director|vp|chief",
}


def clean_html(value: Any) -> str:
    if value is None:
        return ""
    text = BeautifulSoup(str(value), "html.parser").get_text(" ")
    return re.sub(r"\s+", " ", text).strip()


def normalize_skills(values: Iterable[Any], text: str) -> list[str]:
    combined = " ".join(clean_html(v).lower() for v in values) + " " + text.lower()
    found = {name for name, pattern in SKILL_PATTERNS.items() if re.search(pattern, combined, re.I)}
    return sorted(found)


def infer_seniority(value: Any, text: str) -> str | None:
    haystack = f"{clean_html(value)} {text}".lower()
    for name, pattern in SENIORITY_PATTERNS.items():
        if re.search(pattern, haystack, re.I):
            return name
    return None


def parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    raw = str(value).strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(raw)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def fingerprint(record: dict[str, Any]) -> str:
    title = re.sub(r"\W+", " ", str(record.get("title", "")).lower()).strip()
    company = re.sub(r"\W+", " ", str(record.get("company", "")).lower()).strip()
    location = re.sub(r"\W+", " ", str(record.get("location", "")).lower()).strip()
    return hashlib.sha256(f"{title}|{company}|{location}".encode()).hexdigest()


def clean_records(raw_records: Iterable[dict[str, Any]]) -> tuple[list[JobRecord], int]:
    result: list[JobRecord] = []
    seen_source: set[tuple[str, str]] = set()
    seen_fingerprints: set[str] = set()
    duplicates = 0

    for raw in raw_records:
        description = clean_html(raw.get("description"))
        source = str(raw.get("source", "")).strip()
        source_id = str(raw.get("source_id", "")).strip()
        key = (source, source_id)
        if key in seen_source or fingerprint(raw) in seen_fingerprints:
            duplicates += 1
            continue
        try:
            record = JobRecord(
                source=source,
                source_id=source_id,
                source_url=str(raw.get("source_url", "")).strip(),
                title=clean_html(raw.get("title")),
                company=clean_html(raw.get("company")) or None,
                description=description,
                location=clean_html(raw.get("location")) or None,
                remote=raw.get("remote"),
                employment_type=clean_html(raw.get("employment_type")) or None,
                seniority=infer_seniority(raw.get("seniority"), f"{raw.get('title', '')} {description}"),
                skills=normalize_skills(raw.get("skills") or [], f"{raw.get('title', '')} {description}"),
                salary_min=raw.get("salary_min"), salary_max=raw.get("salary_max"),
                salary_currency=clean_html(raw.get("salary_currency")) or None,
                salary_period=clean_html(raw.get("salary_period")) or None,
                published_at=parse_datetime(raw.get("published_at")),
                attribution_required=bool(raw.get("attribution_required", False)),
                raw_hash=str(raw.get("raw_hash", "")),
            )
        except Exception:
            continue
        result.append(record)
        seen_source.add(key)
        seen_fingerprints.add(fingerprint(raw))
    return result, duplicates
