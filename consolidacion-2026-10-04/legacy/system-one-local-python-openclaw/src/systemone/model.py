"""Backends de puntuación. Por defecto 'heuristic' (100% offline, determinista).
'ollama' es opcional y cae a heuristic si no está disponible."""
from __future__ import annotations
import os, re, math
from typing import Protocol

_WORD = re.compile(r"[a-záéíóúñü0-9]+", re.I)

def _tokens(s: str) -> list[str]:
    return _WORD.findall((s or "").lower())

class Backend(Protocol):
    name: str
    def score(self, state: str, prompt: str, candidate: str) -> float: ...


class HeuristicBackend:
    """Puntúa por solapamiento léxico con el estado + micro-prior.
    Rápido, offline y explicable (base sólida para tests y arranque sin modelo)."""
    name = "heuristic"

    def __init__(self):
        self._bonus = {
            "urgente": 1.2, "crítico": 1.2, "critico": 1.2, "caído": 1.0, "caido": 1.0,
            "error": 0.8, "urgent": 1.2, "critical": 1.2, "down": 1.0,
            "spam": 1.0, "abuso": 1.0, "seguro": 0.8, "ok": 0.3,
        }

    def score(self, state: str, prompt: str, candidate: str) -> float:
        st = _tokens(state)
        ct = _tokens(candidate)
        # Noul/bool: validar la afirmación (prompt) contra el estado
        if candidate.lower() in ("sí", "si"):
            ct = _tokens(prompt)
        if not ct:
            return 0.0
        sset = set(st)
        shared = sum(1 for t in ct if t in sset)
        # separación clara: premia solapamiento, penaliza longitud
        base = 2.5 * shared - 0.2 * len(ct)
        bonus = sum(self._bonus.get(t, 0.0) for t in ct)
        return base + bonus


class OllamaBackend:
    """Pide a Ollama una puntuación 0-100 por candidato. Si falla, usa heuristic."""
    name = "ollama"

    def __init__(self, url: str | None = None, model: str | None = None):
        self.url = (url or os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")).rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
        self._fallback = HeuristicBackend()

    def score(self, state: str, prompt: str, candidate: str) -> float:
        try:
            import httpx
            q = (f"Estado:\n{state}\n\nPregunta: {prompt}\nOpción: {candidate}\n"
                 "Responde SOLO con un número entre 0 y 100 que indique cuánto encaja la opción.")
            r = httpx.post(f"{self.url}/api/generate",
                           json={"model": self.model, "prompt": q, "stream": False},
                           timeout=20)
            txt = r.json().get("response", "")
            m = re.search(r"-?\d+(\.\d+)?", txt)
            return (float(m.group(0)) / 25.0) if m else self._fallback.score(state, prompt, candidate)
        except Exception:
            return self._fallback.score(state, prompt, candidate)


def get_backend(name: str | None = None) -> Backend:
    name = (name or os.getenv("SYSTEMONE_BACKEND", "heuristic")).lower()
    if name == "ollama":
        return OllamaBackend()
    return HeuristicBackend()
