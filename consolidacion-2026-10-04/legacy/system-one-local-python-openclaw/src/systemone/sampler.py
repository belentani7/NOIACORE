"""Muestreo en paralelo conceptual: puntúa TODAS las opciones en una pasada,
softmax -> distribución -> valor + confidence. Sin generar token a token."""
from __future__ import annotations
import math
from typing import Callable

from .schema import Question, QType

Scorer = Callable[[str, str, str], float]  # (state, prompt, candidate) -> logit


def softmax(scores: list[float], temperature: float = 1.0) -> list[float]:
    if temperature <= 0:
        temperature = 1.0
    m = max(scores)
    exps = [math.exp((s - m) / temperature) for s in scores]
    total = sum(exps) or 1.0
    return [e / total for e in exps]


def _scale_points(q: Question) -> list[float]:
    lo, hi = float(q.min), float(q.max)
    step = float(q.step) if q.step else max((hi - lo) / 10.0, 1.0)
    pts, x = [], lo
    # máx. 11 puntos para mantener coste bajo
    while x <= hi + 1e-9 and len(pts) < 11:
        pts.append(round(x, 4))
        x += step
    if pts[-1] != hi:
        pts.append(hi)
    return pts


def decide_question(q: Question, state: str, scorer: Scorer,
                    temperature: float = 1.0) -> tuple[object, dict[str, float], float]:
    """Devuelve (valor, distribución, confianza)."""
    if q.type == QType.choice:
        cands = list(q.options or [])
        base = q.prompt
    elif q.type == QType.score:
        pts = _scale_points(q)
        cands = [str(p) for p in pts]
        base = q.prompt
    else:  # bool / Noul
        cands = ["sí", "no"]
        base = q.statement or q.prompt

    logits = [scorer(state, base, c) for c in cands]
    probs = softmax(logits, temperature)
    dist = {c: round(p, 4) for c, p in zip(cands, probs)}
    idx = max(range(len(probs)), key=lambda i: probs[i])
    top = probs[idx]

    if q.type == QType.choice:
        value = cands[idx]
    elif q.type == QType.score:
        # posición ponderada por el valor del punto
        pts = _scale_points(q)
        value = round(sum(p * v for p, v in zip(probs, pts)), 3)
    else:
        value = bool(cands[idx] == "sí")

    return value, dist, round(top, 4)
