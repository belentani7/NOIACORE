"""Esquemas de entrada/salida (Pydantic v2)."""
from __future__ import annotations
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field, model_validator


class QType(str, Enum):
    choice = "choice"
    score = "score"
    bool = "bool"


class Question(BaseModel):
    id: str
    type: QType
    prompt: str
    # choice
    options: Optional[list[str]] = None
    # score
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None
    # bool (Noul): afirmación a validar
    statement: Optional[str] = None

    @model_validator(mode="after")
    def _check(self):
        if self.type == QType.choice:
            if not self.options or len(self.options) < 2:
                raise ValueError("choice requiere al menos 2 opciones en 'options'")
        if self.type == QType.score:
            if self.min is None or self.max is None or self.min >= self.max:
                raise ValueError("score requiere min y max válidos (min < max)")
        if self.type == QType.bool and not self.statement:
            raise ValueError("bool requiere 'statement'")
        return self


class DecideRequest(BaseModel):
    state: str = Field(..., min_length=1)
    questions: list[Question] = Field(..., min_length=1)
    threshold: float = 0.6
    backend: Optional[str] = None


class Decision(BaseModel):
    id: str
    type: QType
    value: Any
    confidence: float
    distribution: dict[str, float] = {}
    escalated: bool = False


class DecideResponse(BaseModel):
    backend: str
    latency_ms: float
    decisions: list[Decision]
