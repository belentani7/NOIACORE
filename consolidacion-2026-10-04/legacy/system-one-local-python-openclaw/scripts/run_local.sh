#!/usr/bin/env bash
# Arranca la API local en un comando.
set -e
cd "$(dirname "$0")/.."
export PYTHONPATH="src"
PY="${PYTHON:-python}"
echo "Backend: ${SYSTEMONE_BACKEND:-heuristic}  ->  http://127.0.0.1:8077"
exec "$PY" -m uvicorn systemone.api:app --host 127.0.0.1 --port 8077
