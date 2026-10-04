#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${PYTHON_BIN:-python3}"
command -v "$PYTHON_BIN" >/dev/null || { echo "Python 3 is required" >&2; exit 1; }
"$PYTHON_BIN" -m venv "$ROOT/.venv"
"$ROOT/.venv/bin/pip" install --upgrade pip
"$ROOT/.venv/bin/pip" install -r "$ROOT/requirements.txt"
mkdir -p "$ROOT/data/processed" "$ROOT/logs"
cat > "$ROOT/run_nexus.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$ROOT/src"
exec "$ROOT/.venv/bin/python" -m nexus.main "$@"
EOF
chmod +x "$ROOT/run_nexus.sh"
cat > "$ROOT/healthcheck.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$ROOT/src"
"$ROOT/.venv/bin/python" -c "from nexus.pipeline import Pipeline; p=Pipeline(); p.init_db(); print('NEXUS DATA OK')"
EOF
chmod +x "$ROOT/healthcheck.sh"
echo "Installed NEXUS DATA under $ROOT"
echo "Run: $ROOT/run_nexus.sh"
echo "Dashboard: $ROOT/.venv/bin/streamlit run $ROOT/app/streamlit_app.py"
