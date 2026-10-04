# system-one-local

API local de **decisiones tipadas** (estilo Jev / TypeSafe AI): recibe un `state` y un
esquema de **preguntas cerradas** (`choice`, `score`, `bool`) y devuelve **valor + confidence**.
**Cero generación de texto libre.** Todo corre **offline**.

## Qué hace

| Primitiva | Pregunta | Devuelve |
|---|---|---|
| **choice** | ¿Cuál de estas opciones? | opción elegida + probabilidad por opción + confidence |
| **score** | ¿Dónde cae en una escala ordenada? | posición ponderada (media por distribución) + confidence |
| **bool** (Noul) | ¿Es verdad esta afirmación? | sí/no + probabilidad de “sí” |

En vez de generar token a token, **puntúa todas las opciones en una pasada**, aplica
`softmax` y se queda con la mayor probabilidad. Si la confianza baja del **umbral**, marca
la decisión como `escalated` (para fallback a humano u otro LLM).

## Instalación

```bash
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install fastapi "uvicorn[standard]" pydantic httpx pytest   # Windows
# o:  pip install -e ".[dev]"
```

## Arrancar la API (un comando)

```bash
# Windows
powershell -ExecutionPolicy Bypass -File scripts\run_local.ps1
# Linux/Mac
bash scripts/run_local.sh
```
Queda en `http://127.0.0.1:8077`.

## Uso — API

```bash
curl -X POST http://127.0.0.1:8077/decide -H "Content-Type: application/json" -d @examples/triage_ticket.json
```

Respuesta real (medida):
```json
{"backend":"heuristic","latency_ms":0.86,"decisions":[
 {"id":"prioridad","type":"choice","value":"Crítica","confidence":0.8024,
  "distribution":{"Baja":0.0659,"Media":0.0659,"Alta":0.0659,"Crítica":0.8024},"escalated":false},
 {"id":"urgente","type":"bool","value":true,"confidence":0.9569,"distribution":{"sí":0.9569,"no":0.0431},"escalated":false},
 {"id":"severidad","type":"score","value":3.0,"confidence":0.2,"escalated":true}]}
```
> La última (score) sale `escalated:true`: con el backend heurístico los números no se
> solapan con el texto, así que la confianza baja → **fallback** (comportamiento correcto).

Alias compatible con el contrato TypeSafe: `POST /v1/systemone` (mismo cuerpo). `GET /health`.

## Uso — CLI

```bash
set PYTHONPATH=src
.\.venv\Scripts\python.exe -m systemone.cli decide --file examples/agent_routing.json
```

## Ejemplos incluidos

- `examples/triage_ticket.json` — prioridad + urgente + severidad.
- `examples/moderation.json` — acción + amenaza + toxicidad.
- `examples/agent_routing.json` — enrutado de agente + aprobación humana.

## Tests

```bash
set PYTHONPATH=src
.\.venv\Scripts\python.exe -m pytest -q      # 10 pruebas: esquema, sampler, API
```

## Backends

| Backend | Estado | Notas |
|---|---|---|
| `heuristic` (por defecto) | **incluido, offline** | solapamiento léxico + micro-priors. Rápido y explicable; base para tests. |
| `ollama` | **opcional** | pide puntuación 0-100 por opción a un modelo local (`qwen2.5:3b`…). Si no responde, cae a `heuristic`. |

Actívalo con `.env`: `SYSTEMONE_BACKEND=ollama`, `OLLAMA_URL`, `OLLAMA_MODEL`.

## Estructura

```
system-one-local/
├── pyproject.toml · .env.example · README.md
├── src/systemone/{__init__,schema,sampler,model,confidence,api,cli}.py
├── examples/{triage_ticket,moderation,agent_routing}.json
├── tests/{conftest,test_schema,test_sampler,test_api}.py
└── scripts/{run_local.sh,run_local.ps1}
```

## Decisiones de diseño (documentadas)

1. **Backend desacoplado**: el “modelo” es un `scorer(state, prompt, candidate) -> logit`.
   Así el sistema es usable sin GPU ni descargas (heuristic) y ampliable (ollama/transformers).
2. **Softmax con temperatura** = calibración configurable (`SYSTEMONE_TEMPERATURE`).
3. **Umbral** (`SYSTEMONE_THRESHOLD`, por defecto 0.6) → `escalated` para fallback.
4. **Sin texto libre por diseño**: la salida es siempre tipada (`value` + `confidence` + `distribution`).

## Rendimiento (medido en esta máquina)

- Latencia por petición: **≈0,6–1,0 ms** (backend heurístico, 3 preguntas).
- RAM: mínima (sin modelo cargado). Con Ollama dependerá del modelo elegido.

## Límites / siguientes pasos

- El backend `heuristic` es un arranque sólido, **no un modelo entrenado**; para calidad real,
  conectar `ollama` (o `transformers` + un small model de decisión tipo Kev) para logits reales.
- Añadir cabeceras de **calibración (RLCD)** y métricas de fiabilidad por pregunta.
