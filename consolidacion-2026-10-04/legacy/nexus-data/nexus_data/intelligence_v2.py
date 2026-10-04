from __future__ import annotations

import hashlib
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from statistics import median
from typing import Any, Iterable

from .v2_models import EnrichedRecord, FieldValue, Insight, Lineage, NicheDefinition, RawRecord, Signal


def jobs_niche() -> NicheDefinition:
    return NicheDefinition(
        name="tech_remote_jobs",
        entities=["Company", "Job", "Location", "Skill"],
        fields=["title", "company", "location", "remote", "seniority", "skills", "salary_min", "salary_max", "published_at"],
        metrics=["salary_median", "skill_demand", "remote_share", "company_hiring_velocity"],
        signals=["demand_spike", "salary_shift", "remote_shift", "company_growth"],
        anomalies=["salary_anomaly", "duplicate", "stale_record", "schema_drift", "conflict", "outlier"],
        insights=["salary_trends", "skill_demand", "remote_trends", "company_hiring_velocity"],
    )


def canonical_entity_id(value: Any) -> str:
    normalized = re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()
    return re.sub(r"\s+", "-", normalized) or "unknown"


def _field(payload: dict[str, Any], name: str, source: str, observed_at: datetime, method: str = "normalization", confidence: float = 0.9) -> FieldValue:
    return FieldValue(value=payload.get(name), confidence=confidence, source=source, observed_at=observed_at, method=method)


def normalize_job(raw: RawRecord) -> EnrichedRecord:
    p = raw.payload
    title = str(p.get("title") or "").strip()
    company = str(p.get("company") or "Unknown").strip()
    entity_id = hashlib.sha256(f"{canonical_entity_id(company)}|{canonical_entity_id(title)}|{p.get('source_id', raw.record_id)}".encode()).hexdigest()[:24]
    fields = {
        "title": _field(p, "title", raw.source, raw.observed_at),
        "company": _field(p, "company", raw.source, raw.observed_at),
        "location": _field(p, "location", raw.source, raw.observed_at),
        "remote": _field(p, "remote", raw.source, raw.observed_at),
        "seniority": _field(p, "seniority", raw.source, raw.observed_at),
        "skills": _field(p, "skills", raw.source, raw.observed_at),
        "salary_min": _field(p, "salary_min", raw.source, raw.observed_at),
        "salary_max": _field(p, "salary_max", raw.source, raw.observed_at),
        "published_at": _field(p, "published_at", raw.source, raw.observed_at),
    }
    completeness = sum(value.value not in (None, "", []) for value in fields.values()) / len(fields)
    validity = 1.0 if title and raw.source_url.startswith(("http://", "https://")) else 0.0
    dq = round((completeness * 0.6) + (validity * 0.4), 4)
    intelligence = min(1.0, round((0.35 if p.get("salary_min") or p.get("salary_max") else 0.0) + (0.25 if p.get("skills") else 0.0) + (0.2 if p.get("company") else 0.0) + (0.2 if p.get("remote") is not None else 0.0), 4))
    return EnrichedRecord(
        record_id=raw.record_id,
        entity_type="Job",
        entity_id=entity_id,
        fields=fields,
        lineage=raw.lineage,
        dq_score=dq,
        first_seen=raw.observed_at,
        last_seen=raw.observed_at,
        enrichment={"company_entity": FieldValue(value=canonical_entity_id(company), confidence=0.95, source=raw.source, method="entity_resolution")},
        intelligence_score=intelligence,
    )


def normalize_records(raw_records: Iterable[RawRecord], niche: NicheDefinition) -> list[EnrichedRecord]:
    if niche.name == "tech_remote_jobs":
        return [normalize_job(raw) for raw in raw_records]
    raise ValueError(f"no normalizer registered for niche '{niche.name}'")


def _fingerprint(record: EnrichedRecord) -> str:
    values = [record.fields.get(key).value if record.fields.get(key) else None for key in ("company", "title", "location")]
    return canonical_entity_id("|".join(str(v) for v in values))


def deduplicate(records: Iterable[EnrichedRecord]) -> tuple[list[EnrichedRecord], list[str]]:
    seen: dict[str, EnrichedRecord] = {}
    duplicates: list[str] = []
    for record in records:
        key = _fingerprint(record)
        if key in seen:
            duplicates.append(record.record_id)
            if record.dq_score > seen[key].dq_score:
                seen[key] = record
        else:
            seen[key] = record
    return list(seen.values()), duplicates


def detect_changes(current: list[EnrichedRecord], previous: list[EnrichedRecord] | None) -> list[dict[str, Any]]:
    previous = previous or []
    old = {_fingerprint(item): item for item in previous}
    now = {_fingerprint(item): item for item in current}
    changes: list[dict[str, Any]] = []
    for key, record in now.items():
        if key not in old:
            changes.append({"type": "NEW", "record_id": record.record_id, "evidence_id": record.record_id})
        elif _content_signature(record) != _content_signature(old[key]):
            changes.append({"type": "CHANGED", "record_id": record.record_id, "previous_record_id": old[key].record_id, "evidence_id": record.record_id})
    for key, record in old.items():
        if key not in now:
            changes.append({"type": "REMOVED", "record_id": record.record_id, "evidence_id": record.record_id})
    return changes


def _content_signature(record: EnrichedRecord) -> str:
    relevant = {key: record.fields[key].value for key in sorted(record.fields)}
    return hashlib.sha256(repr(relevant).encode()).hexdigest()


def build_signals(records: list[EnrichedRecord], changes: list[dict[str, Any]]) -> list[Signal]:
    by_skill: Counter[str] = Counter()
    companies: Counter[str] = Counter()
    remote = 0
    salaried: list[float] = []
    evidence: defaultdict[str, list[str]] = defaultdict(list)
    for record in records:
        company = str(record.fields["company"].value or "Unknown")
        companies[company] += 1
        evidence[f"company_growth:{company}"].append(record.record_id)
        if record.fields["remote"].value is True:
            remote += 1
        skills = record.fields["skills"].value or []
        for skill in skills if isinstance(skills, list) else [skills]:
            by_skill[str(skill).lower()] += 1
            evidence[f"skill_demand:{str(skill).lower()}"].append(record.record_id)
        lo = record.fields["salary_min"].value
        hi = record.fields["salary_max"].value
        if isinstance(lo, (int, float)) and isinstance(hi, (int, float)):
            salaried.append((lo + hi) / 2)
    signals: list[Signal] = []
    if records:
        share = remote / len(records)
        signals.append(Signal(signal_id="remote-share", type="remote_shift", strength=share, confidence=0.82, source_count=len({r.lineage.source for r in records}), first_seen=min(r.first_seen for r in records), last_seen=max(r.last_seen for r in records), trend="up" if share >= 0.5 else "flat", evidence_ids=[r.record_id for r in records[:50]], metadata={"remote_share": share}))
    for skill, count in by_skill.most_common(5):
        signals.append(Signal(signal_id=f"skill-{canonical_entity_id(skill)}", type="skill_demand", strength=min(1.0, count / max(len(records), 1)), confidence=0.9, source_count=len({r.lineage.source for r in records}), first_seen=min(r.first_seen for r in records), last_seen=max(r.last_seen for r in records), trend="up", evidence_ids=evidence[f"skill_demand:{skill}"][:50], metadata={"skill": skill, "count": count}))
    for company, count in companies.most_common(5):
        signals.append(Signal(signal_id=f"company-{canonical_entity_id(company)}", type="company_growth", strength=min(1.0, count / max(len(records), 1)), confidence=0.8, source_count=len({r.lineage.source for r in records}), first_seen=min(r.first_seen for r in records), last_seen=max(r.last_seen for r in records), trend="up", evidence_ids=evidence[f"company_growth:{company}"][:50], metadata={"company": company, "count": count}))
    if salaried:
        signals.append(Signal(signal_id="salary-median", type="salary_shift", strength=0.7, confidence=0.75, source_count=len({r.lineage.source for r in records}), first_seen=min(r.first_seen for r in records), last_seen=max(r.last_seen for r in records), trend="unknown", evidence_ids=[r.record_id for r in records if r.fields["salary_min"].value is not None][:50], metadata={"median": median(salaried), "observations": len(salaried)}))
    return signals


def build_insights(records: list[EnrichedRecord], signals: list[Signal], changes: list[dict[str, Any]]) -> list[Insight]:
    insights: list[Insight] = []
    for signal in signals[:5]:
        if signal.type == "skill_demand":
            skill = signal.metadata["skill"]
            observation = f"La skill {skill} aparece en {signal.metadata['count']} registros normalizados."
            interpretation = "La frecuencia observada indica una señal de demanda dentro de las fuentes monitorizadas."
            impact = "Puede priorizarse como criterio de sourcing o segmentación del mercado."
            recommendation = f"Priorizar campañas y seguimiento temporal para perfiles con {skill}."
        elif signal.type == "remote_shift":
            observation = f"La proporción remota observada es {signal.metadata['remote_share']:.1%}."
            interpretation = "La modalidad remota representa una parte material del inventario actual."
            impact = "Afecta la segmentación geográfica y la estrategia de captación."
            recommendation = "Separar el pipeline remoto del híbrido/presencial y medir su evolución."
        elif signal.type == "salary_shift":
            observation = f"La mediana salarial observada es {signal.metadata['median']:.0f} en {signal.metadata['observations']} observaciones."
            interpretation = "Existe cobertura salarial suficiente para usar la mediana como referencia inicial."
            impact = "Permite comparar oferta y posicionar bandas de compensación."
            recommendation = "Recalcular la mediana por seniority, skill y fuente antes de tomar decisiones."
        else:
            observation = f"La empresa {signal.metadata['company']} concentra {signal.metadata['count']} registros."
            interpretation = "La concentración puede representar actividad de contratación o sesgo de cobertura."
            impact = "Puede orientar priorización comercial, pero requiere seguimiento temporal."
            recommendation = "Validar la concentración en el siguiente snapshot y contrastarla con otras fuentes."
        insights.append(Insight(insight_id=f"insight-{signal.signal_id}", observation=observation, evidence_ids=signal.evidence_ids or [r.record_id for r in records[:1]], interpretation=interpretation, impact=impact, recommendation=recommendation, confidence=signal.confidence, signal_ids=[signal.signal_id]))
    if changes:
        ids = [item["evidence_id"] for item in changes if item.get("evidence_id")]
        insights.append(Insight(insight_id="insight-change-activity", observation=f"Se detectaron {len(changes)} cambios entre snapshots.", evidence_ids=ids[:50] or [records[0].record_id], interpretation="La superficie monitorizada no es estática y debe analizarse como serie temporal.", impact="Los cambios recientes pueden ser más accionables que el inventario bruto.", recommendation="Priorizar revisión de cambios NEW y CHANGED antes de ampliar cobertura.", confidence=0.9, signal_ids=[]))
    return insights
