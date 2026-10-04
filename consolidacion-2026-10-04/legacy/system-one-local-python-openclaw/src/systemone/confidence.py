"""Calibración de confianza y umbral de escalado (fallback)."""
from __future__ import annotations
import os

def threshold_from_env(default: float = 0.6) -> float:
    try:
        return float(os.getenv("SYSTEMONE_THRESHOLD", default))
    except ValueError:
        return default

def temperature_from_env(default: float = 1.0) -> float:
    try:
        return float(os.getenv("SYSTEMONE_TEMPERATURE", default))
    except ValueError:
        return default

def escalar(confidence: float, threshold: float) -> bool:
    """Si la confianza baja del umbral, se marca para fallback (humano/LLM)."""
    return confidence < threshold
