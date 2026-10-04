from systemone.schema import Question, QType
from systemone.model import HeuristicBackend
from systemone.sampler import decide_question


def test_choice_alta_confianza():
    q = Question(id="p", type=QType.choice, prompt="prioridad",
                 options=["Baja", "Media", "Alta", "Crítica"])
    state = "Incidencia crítica y urgente, el servicio está caído."
    value, dist, conf = decide_question(q, state, HeuristicBackend().score)
    assert value == "Crítica"
    assert conf > 0.6


def test_baja_confianza_escalado():
    q = Question(id="p", type=QType.choice, prompt="elige",
                 options=["Alfa", "Beta", "Gamma"])
    # estado sin solapamiento -> distribución casi uniforme -> confianza baja
    value, dist, conf = decide_question(q, "xyz qqq", HeuristicBackend().score)
    assert conf < 0.6


def test_bool_yes():
    q = Question(id="u", type=QType.bool, prompt="urgente", statement="Es urgente")
    value, dist, conf = decide_question(q, "esto es urgente de verdad", HeuristicBackend().score)
    assert value is True
