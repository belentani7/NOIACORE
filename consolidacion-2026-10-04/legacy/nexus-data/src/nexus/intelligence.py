from __future__ import annotations

import hashlib
import json
import os
import time
from typing import Any

TAXONOMY = {
    "cloud": ("cloud", "hosting", "saas"),
    "data": ("data", "analytics", "database", "information management"),
    "cybersecurity": ("cyber", "security", "identity", "incident response"),
    "software": ("software", "digital", "application", "platform"),
}


def deterministic_labels(row: dict[str, Any], method: str = "deterministic") -> dict[str, Any]:
    text = f"{row.get('title', '')} {row.get('description', '')} {row.get('category', '')}".lower()
    tags = [tag for tag, words in TAXONOMY.items() if any(word in text for word in words)]
    return {"labels": tags, "summary": str(row.get("description", ""))[:240], "confidence": 0.65 if tags else 0.4, "method": method}


def _cache_key(row: dict[str, Any]) -> str:
    payload = {key: row.get(key) for key in ("title", "description", "category", "amount", "currency", "record_type")}
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def _validate(parsed: dict[str, Any]) -> dict[str, Any]:
    labels = parsed.get("labels")
    summary = parsed.get("summary")
    confidence = parsed.get("confidence")
    if not isinstance(labels, list) or not all(isinstance(item, str) and item.strip() for item in labels):
        raise ValueError("labels inválidos")
    if not isinstance(summary, str) or not summary.strip():
        raise ValueError("summary inválido")
    if not isinstance(confidence, (int, float)):
        raise TypeError("confidence inválida")
    return {"labels": labels[:8], "summary": summary.strip()[:500], "confidence": max(0.0, min(float(confidence), 1.0))}


def enrich_with_llm(rows: list[dict[str, Any]], model: str | None = None) -> list[dict[str, Any]]:
    """Enriquecimiento explícito: desactivado por defecto, acotado y trazable por fila."""
    enabled = os.getenv("NEXUS_ENABLE_LLM", "false").lower() in {"1", "true", "yes"}
    if not enabled or not os.getenv("OPENAI_API_KEY"):
        for row in rows:
            row["intelligence"] = deterministic_labels(row)
        return rows
    selected_model = model or os.getenv("NEXUS_LLM_MODEL", "gpt-5-mini")
    max_rows = max(0, min(int(os.getenv("NEXUS_LLM_MAX_ROWS", "25")), 100))
    cache: dict[str, dict[str, Any]] = {}
    schema = {
        "type": "object",
        "properties": {
            "labels": {"type": "array", "items": {"type": "string"}},
            "summary": {"type": "string"},
            "confidence": {"type": "number"},
        },
        "required": ["labels", "summary", "confidence"],
        "additionalProperties": False,
    }
    try:
        from openai import OpenAI
        client = OpenAI()
    except Exception as exc:  # noqa: BLE001
        for row in rows:
            row["intelligence"] = deterministic_labels(row, "deterministic_provider_unavailable")
            row["intelligence_error"] = type(exc).__name__
        return rows
    for index, row in enumerate(rows):
        key = _cache_key(row)
        if key in cache:
            row["intelligence"] = {**cache[key], "method": f"{selected_model}:cache"}
            continue
        if index >= max_rows:
            row["intelligence"] = deterministic_labels(row, "deterministic_cap")
            continue
        prompt = {key: row.get(key) for key in ("title", "description", "category", "amount", "currency", "country", "record_type")}
        last_error: Exception | None = None
        for attempt in range(2):
            try:
                response = client.chat.completions.create(
                    model=selected_model,
                    messages=[
                        {"role": "system", "content": "Classify one public-procurement record. Do not infer legal eligibility, procurement status, supplier fit, or facts absent from the input. Return only the requested JSON."},
                        {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
                    ],
                    response_format={"type": "json_schema", "json_schema": {"name": "opportunity_intelligence", "strict": True, "schema": schema}},
                    max_completion_tokens=220,
                )
                parsed = _validate(json.loads(response.choices[0].message.content or "{}"))
                cache[key] = parsed
                row["intelligence"] = {**parsed, "method": selected_model}
                break
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                if attempt == 0:
                    time.sleep(0.5)
        else:
            row["intelligence"] = deterministic_labels(row, "deterministic_llm_fallback")
            row["intelligence_error"] = type(last_error).__name__ if last_error else "unknown"
    return rows
