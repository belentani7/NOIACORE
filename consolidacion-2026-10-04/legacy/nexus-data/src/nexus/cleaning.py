from __future__ import annotations

import hashlib
import re
from datetime import date, datetime
from typing import Any

from .extractor import RawRecord

CANONICAL_FIELDS = [
    "source", "source_id", "title", "buyer", "deadline", "published_date", "amount", "currency",
    "country", "category", "description", "source_url", "record_type", "retrieved_at",
    "raw_payload_hash", "data_origin", "is_valid", "quality_flags", "dedupe_key",
]


def nested(obj: dict[str, Any], path: str | None) -> Any:
    if not path:
        return None
    current: Any = obj
    for part in path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def field_value(payload: dict[str, Any], config: dict[str, Any], field: str) -> Any:
    mapping = config.get("fields", {}).get(field)
    value = nested(payload, mapping) if isinstance(mapping, str) else None
    if value not in (None, ""):
        return value
    if field in payload and payload[field] not in (None, ""):
        return payload[field]
    return config.get("constants", {}).get(field)


def clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def parse_amount(value: Any) -> float | None:
    if value in (None, ""):
        return None
    text = str(value).strip().replace(" ", "")
    text = re.sub(r"[^0-9,.-]", "", text)
    if not text or text in {"-", ".", ","}:
        return None
    if "," in text and "." in text:
        text = text.replace(",", "") if text.rfind(".") > text.rfind(",") else text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".") if text.count(",") == 1 and len(text.split(",")[1]) in {1, 2} else text.replace(",", "")
    try:
        return float(text)
    except ValueError:
        return None


def parse_date(value: Any) -> str | None:
    if not value:
        return None
    text = str(value).strip().replace("/", "-")
    try:
        return date.fromisoformat(text[:10]).isoformat()
    except ValueError:
        pass
    try:
        return datetime.strptime(text[:10], "%m-%d-%Y").date().isoformat()  # noqa: DTZ007 - entrada sin zona es una fecha civil
    except ValueError:
        return None


def _dedupe_key(row: dict[str, Any]) -> str:
    basis = "|".join((row["source"], row["source_id"], row["title"].lower(), row["buyer"].lower(), row.get("deadline") or ""))
    return hashlib.sha256(basis.encode("utf-8")).hexdigest()[:24]


def clean_records(records: list[RawRecord], configs: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, int]]:
    by_name = {config["name"]: config for config in configs}
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    metrics = {"received": len(records), "valid": 0, "invalid": 0, "duplicates": 0, "actionable": 0}
    for raw in records:
        config = by_name.get(raw.source)
        if not config:
            metrics["invalid"] += 1
            continue
        row = {
            "source": raw.source,
            "source_id": raw.source_id,
            "title": clean_text(field_value(raw.payload, config, "title")),
            "buyer": clean_text(field_value(raw.payload, config, "buyer")),
            "deadline": parse_date(field_value(raw.payload, config, "deadline")),
            "published_date": parse_date(field_value(raw.payload, config, "published_date")),
            "amount": parse_amount(field_value(raw.payload, config, "amount")),
            "currency": clean_text(field_value(raw.payload, config, "currency")).upper(),
            "country": clean_text(field_value(raw.payload, config, "country")).upper(),
            "category": clean_text(field_value(raw.payload, config, "category")),
            "description": clean_text(field_value(raw.payload, config, "description")),
            "source_url": raw.source_url,
            "record_type": clean_text(field_value(raw.payload, config, "record_type") or "opportunity").lower(),
            "retrieved_at": raw.retrieved_at,
            "raw_payload_hash": raw.raw_payload_hash,
            "data_origin": raw.data_origin,
        }
        row["dedupe_key"] = _dedupe_key(row)
        if row["dedupe_key"] in seen:
            metrics["duplicates"] += 1
            continue
        seen.add(row["dedupe_key"])
        flags: list[str] = []
        if not row["title"]:
            flags.append("missing_title")
        if not row["buyer"]:
            flags.append("missing_buyer")
        if row["amount"] is None:
            flags.append("missing_amount")
        if row["amount"] is not None and row["amount"] < 0:
            flags.append("negative_amount")
        if not row["currency"] and row["amount"] is not None:
            flags.append("missing_currency")
        if row["record_type"] == "opportunity" and not row["deadline"]:
            flags.append("missing_deadline")
        row["quality_flags"] = ",".join(flags)
        row["is_valid"] = not any(flag in flags for flag in ("missing_title", "missing_buyer", "negative_amount"))
        metrics["valid" if row["is_valid"] else "invalid"] += 1
        if row["is_valid"] and row["record_type"] == "opportunity":
            metrics["actionable"] += 1
        rows.append(row)
    return rows, metrics
