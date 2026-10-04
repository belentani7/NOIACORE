import pytest
from pydantic import ValidationError
from systemone.schema import DecideRequest, QType


def test_request_valido():
    r = DecideRequest(state="hola", questions=[
        {"id": "a", "type": "choice", "prompt": "p", "options": ["x", "y"]}
    ])
    assert r.questions[0].type == QType.choice


def test_choice_requiere_dos_opciones():
    with pytest.raises(ValidationError):
        DecideRequest(state="hola", questions=[
            {"id": "a", "type": "choice", "prompt": "p", "options": ["solo"]}
        ])


def test_bool_requiere_statement():
    with pytest.raises(ValidationError):
        DecideRequest(state="hola", questions=[{"id": "b", "type": "bool", "prompt": "p"}])


def test_score_requiere_min_max():
    with pytest.raises(ValidationError):
        DecideRequest(state="hola", questions=[{"id": "s", "type": "score", "prompt": "p", "min": 5, "max": 1}])
