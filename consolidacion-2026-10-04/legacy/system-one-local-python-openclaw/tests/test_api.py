from fastapi.testclient import TestClient
from systemone.api import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_decide_endpoint():
    body = {
        "state": "Incidencia crítica y urgente: el servicio está caído.",
        "threshold": 0.6,
        "questions": [
            {"id": "p", "type": "choice", "prompt": "prioridad",
             "options": ["Baja", "Media", "Alta", "Crítica"]}
        ],
    }
    r = client.post("/decide", json=body)
    assert r.status_code == 200
    data = r.json()
    assert len(data["decisions"]) == 1
    assert data["decisions"][0]["value"] == "Crítica"
    assert data["decisions"][0]["confidence"] > 0.6
    assert data["backend"] == "heuristic"


def test_alias_v1_systemone():
    body = {"state": "hola urgente", "questions": [
        {"id": "u", "type": "bool", "prompt": "u", "statement": "Es urgente"}]}
    r = client.post("/v1/systemone", json=body)
    assert r.status_code == 200
    assert r.json()["decisions"][0]["value"] is True
