"""API local (FastAPI): POST /decide y alias POST /v1/systemone."""
from __future__ import annotations
import time
from fastapi import FastAPI

from .schema import DecideRequest, DecideResponse, Decision
from .model import get_backend
from .sampler import decide_question
from .confidence import threshold_from_env, temperature_from_env, escalar

app = FastAPI(title="system-one-local", version="0.1.0",
              description="Decisiones tipadas con valor + confidence. Sin texto libre.")


def run_decide(req: DecideRequest) -> DecideResponse:
    t0 = time.perf_counter()
    backend = get_backend(req.backend)
    temp = temperature_from_env()
    decs: list[Decision] = []
    for q in req.questions:
        value, dist, conf = decide_question(q, req.state, backend.score, temp)
        decs.append(Decision(id=q.id, type=q.type, value=value, confidence=conf,
                             distribution=dist, escalated=escalar(conf, req.threshold)))
    return DecideResponse(backend=backend.name,
                          latency_ms=round((time.perf_counter() - t0) * 1000, 2),
                          decisions=decs)


@app.get("/health")
def health():
    return {"status": "ok", "threshold_default": threshold_from_env()}


@app.post("/decide", response_model=DecideResponse)
def decide(req: DecideRequest) -> DecideResponse:
    return run_decide(req)


@app.post("/v1/systemone", response_model=DecideResponse)
def systemone(req: DecideRequest) -> DecideResponse:
    return run_decide(req)
