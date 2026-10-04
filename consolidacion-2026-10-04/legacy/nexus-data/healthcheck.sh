#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$ROOT/src"
"$ROOT/.venv/bin/python" -c "from nexus.pipeline import Pipeline; p=Pipeline(); p.init_db(); print('NEXUS DATA OK')"
