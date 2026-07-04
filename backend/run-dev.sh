#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8080}"

if [[ ! -d .venv ]]; then
  echo "Backend virtualenv not found. Run: ../.venv/bin/poetry install" >&2
  exit 1
fi

if ! .venv/bin/python -c "import uvicorn" 2>/dev/null; then
  echo "Uvicorn is not installed in .venv. Run: ../.venv/bin/poetry install" >&2
  exit 1
fi

if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Port $PORT is already in use. Stop the existing process or run with a different port:" >&2
  echo "  PORT=8081 ./run-dev.sh" >&2
  lsof -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true
  exit 1
fi

echo "Starting backend at http://${HOST}:${PORT}"
exec .venv/bin/uvicorn main:app --reload --host "$HOST" --port "$PORT" "$@"
