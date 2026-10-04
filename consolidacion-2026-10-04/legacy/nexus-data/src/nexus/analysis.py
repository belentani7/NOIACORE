from __future__ import annotations

from collections import Counter, defaultdict
from datetime import UTC, datetime
from statistics import median
from typing import Any

TECH_KEYWORDS = ("software", "data", "cloud", "cyber", "security", "analytics", "digital", "platform", "ai", "information technology")


def _days_until(value: str | None, today: datetime.date) -> int | None:
    if not value:
        return None
    try:
        return (datetime.fromisoformat(value).date() - today).days
    except ValueError:
        return None


def _fit_score(row: dict[str, Any]) -> tuple[int, list[str]]:
    reasons: list[str] = []
    if not row.get("is_valid") or row.get("record_type") != "opportunity":
        return 0, ["No es una oportunidad abierta y válida"]
    score = 25
    text = f"{row.get('title', '')} {row.get('description', '')} {row.get('category', '')}".lower()
    if any(keyword in text for keyword in TECH_KEYWORDS):
        score += 35
        reasons.append("Encaje con capacidades digitales")
    days = row.get("days_to_deadline")
    if isinstance(days, int) and 7 <= days <= 45:
        score += 20
        reasons.append("Plazo compatible con preparación")
    elif isinstance(days, int) and 1 <= days < 7:
        score += 8
        reasons.append("Plazo urgente")
    amount = row.get("amount")
    if isinstance(amount, (int, float)) and 0 < amount <= 500_000:
        score += 15
        reasons.append("Importe potencialmente accesible para pyme")
    elif amount is None:
        score += 5
        reasons.append("Importe requiere revisión manual")
    if row.get("published_date"):
        score += 5
        reasons.append("Fecha de publicación disponible")
    return min(score, 100), reasons or ["Coincidencia base con oportunidad abierta"]


def analyze(rows: list[dict[str, Any]]) -> dict[str, Any]:
    today = datetime.now(UTC).date()
    valid_rows = [row for row in rows if row.get("is_valid")]
    amounts_by_currency: dict[str, list[float]] = defaultdict(list)
    for row in valid_rows:
        row["days_to_deadline"] = _days_until(row.get("deadline"), today)
        days = row["days_to_deadline"]
        row["urgency"] = "urgent" if row.get("record_type") == "opportunity" and isinstance(days, int) and 0 <= days <= 14 else "near_term" if row.get("record_type") == "opportunity" and isinstance(days, int) and 15 <= days <= 30 else "normal"
        if isinstance(row.get("amount"), (int, float)) and row["amount"] > 0 and row.get("currency"):
            amounts_by_currency[row["currency"]].append(row["amount"])
    medians = {currency: median(values) for currency, values in amounts_by_currency.items()}
    for row in rows:
        med = medians.get(row.get("currency"))
        row["amount_anomaly"] = bool(med and isinstance(row.get("amount"), (int, float)) and row["amount"] > med * 3)
        row["sme_fit"], row["score_reasons"] = _fit_score(row)
    opportunities = [row for row in valid_rows if row.get("record_type") == "opportunity" and isinstance(row.get("days_to_deadline"), int) and row["days_to_deadline"] >= 0]
    awards = [row for row in valid_rows if row.get("record_type") == "award"]
    shortlist = sorted(opportunities, key=lambda row: (row.get("sme_fit", 0), -row.get("days_to_deadline", 999)), reverse=True)[:10]
    buyers = Counter(row.get("buyer") or "Unknown" for row in valid_rows)
    return {
        "total_records": len(rows),
        "valid_records": len(valid_rows),
        "actionable_opportunities": len(opportunities),
        "award_records": len(awards),
        "urgent": sum(row.get("urgency") == "urgent" for row in opportunities),
        "median_amount_by_currency": medians,
        "buyers": buyers,
        "categories": Counter(row.get("category") or "Unknown" for row in valid_rows),
        "shortlist": shortlist,
        "quality": {
            "with_amount": sum(row.get("amount") is not None for row in valid_rows),
            "with_deadline": sum(bool(row.get("deadline")) for row in opportunities),
            "with_source_url": sum(bool(row.get("source_url")) for row in valid_rows),
        },
    }


def report(analysis: dict[str, Any]) -> str:
    if not analysis["total_records"]:
        return "No se recibieron registros; revisa las métricas por fuente y sus credenciales o disponibilidad."
    lines = [
        f"Se procesaron **{analysis['total_records']} registros**: **{analysis['actionable_opportunities']} oportunidades abiertas accionables** y **{analysis['award_records']} adjudicaciones** para inteligencia de compradores.",
        f"Hay **{analysis['urgent']} oportunidades** con vencimiento en los próximos 14 días. Los importes se analizan por moneda y nunca se agregan entre jurisdicciones.",
    ]
    if analysis["buyers"]:
        buyer, count = analysis["buyers"].most_common(1)[0]
        lines.append(f"El comprador más recurrente es **{buyer}** con {count} registros; conviene revisarlo como cuenta objetivo y contrastar su histórico de gasto.")
    if analysis["shortlist"]:
        lines.append("Shortlist priorizado por encaje digital, plazo, importe y calidad de dato:")
        for row in analysis["shortlist"][:3]:
            reasons = "; ".join(row.get("score_reasons", [])[:2])
            lines.append(f"- **{row['title']}** — {row['buyer']}; fecha límite {row.get('deadline') or 'no disponible'}; score {row['sme_fit']}/100; razones: {reasons}; fuente {row['source']}.")
    else:
        lines.append("No hay oportunidades abiertas y vigentes en el lote actual; las adjudicaciones siguen disponibles para inteligencia de compradores, no para bid/no-bid.")
    anomalies = sum(bool(row.get("amount_anomaly")) for row in analysis["shortlist"])
    lines.append(f"Se detectaron {anomalies} anomalías de importe dentro de su misma moneda en el shortlist. La recomendación sigue siendo validar elegibilidad, lotes, certificaciones y capacidad de entrega antes de presentar una oferta.")
    return "\n\n".join(lines)
