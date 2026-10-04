from __future__ import annotations

import json
import os
from collections import Counter
from typing import Any

import pandas as pd

from .models import JobRecord


def _records_df(records: list[JobRecord]) -> pd.DataFrame:
    rows = [r.model_dump(mode="json") for r in records]
    return pd.DataFrame(rows) if rows else pd.DataFrame()


def build_report(records: list[JobRecord], duplicate_records: int = 0) -> dict[str, Any]:
    df = _records_df(records)
    if df.empty:
        return {"summary": "No se recibieron registros válidos.", "kpis": {}, "insights": [], "anomalies": []}

    skill_counts = Counter(skill for skills in df["skills"] for skill in (skills or []))
    source_counts = df["source"].value_counts().to_dict()
    seniority_counts = df["seniority"].fillna("unknown").value_counts().to_dict()
    locations = df["location"].fillna("unknown").value_counts().head(10).to_dict()
    remote_rate = float(df["remote"].fillna(False).astype(bool).mean())
    salary_rows = df[df["salary_min"].notna() | df["salary_max"].notna()]

    anomalies: list[dict[str, Any]] = []
    if len(df) >= 8:
        counts = df["company"].fillna("unknown").value_counts()
        threshold = max(5, int(len(df) * 0.20))
        for company, count in counts.items():
            if count >= threshold:
                anomalies.append({"type": "company_concentration", "company": company, "count": int(count)})
    missing_salary_rate = float(df["salary_min"].isna().mean())
    if missing_salary_rate > 0.9:
        anomalies.append({"type": "salary_coverage", "missing_rate": round(missing_salary_rate, 3)})

    insights = [
        f"Se consolidaron {len(df):,} vacantes válidas de {df['source'].nunique()} fuentes; se descartaron {duplicate_records:,} duplicados.",
        f"La modalidad remota aparece explícita en {remote_rate:.0%} de los registros.",
        f"Las skills más frecuentes son: {', '.join(f'{k} ({v})' for k, v in skill_counts.most_common(5)) or 'sin skills detectadas'}.",
        f"El nivel más frecuente es {max(seniority_counts, key=seniority_counts.get)} con {max(seniority_counts.values())} anuncios.",
        f"Solo {len(salary_rows):,} de {len(df):,} anuncios contienen algún salario; la cobertura salarial es {len(salary_rows)/len(df):.0%}.",
    ]
    return {
        "summary": "Informe de inteligencia de empleo tecnológico remoto generado a partir de fuentes públicas.",
        "kpis": {
            "valid_records": int(len(df)), "sources": int(df["source"].nunique()),
            "remote_rate": round(remote_rate, 4), "salary_coverage": round(len(salary_rows) / len(df), 4),
            "duplicate_records": duplicate_records,
        },
        "by_source": {str(k): int(v) for k, v in source_counts.items()},
        "by_seniority": {str(k): int(v) for k, v in seniority_counts.items()},
        "top_skills": {str(k): int(v) for k, v in skill_counts.most_common(20)},
        "top_locations": {str(k): int(v) for k, v in locations.items()},
        "insights": insights,
        "anomalies": anomalies,
    }


def llm_report(report: dict[str, Any]) -> str | None:
    if not os.getenv("OPENAI_API_KEY"):
        return None
    try:
        from openai import OpenAI

        client = OpenAI()
        response = client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": "Eres analista de recruiting. Redacta un resumen ejecutivo breve, prudente y accionable en español. No inventes datos; cita los KPIs proporcionados."},
                {"role": "user", "content": json.dumps(report, ensure_ascii=False)},
            ],
            max_completion_tokens=800,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "executive_report",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {"executive_summary": {"type": "string"}, "actions": {"type": "array", "items": {"type": "string"}}},
                        "required": ["executive_summary", "actions"],
                        "additionalProperties": False,
                    },
                },
            },
        )
        return response.choices[0].message.content
    except Exception:
        return None
