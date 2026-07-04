#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
BACKEND="$ROOT/backend"

cd "$BACKEND"

if [[ ! -x .venv/bin/alembic ]]; then
	echo "pre-push: Alembic not found. Run: cd backend && poetry install" >&2
	exit 1
fi

CHECK_DB="$(mktemp --suffix=.db)"
trap 'rm -f "$CHECK_DB"' EXIT

export DATABASE_URL="sqlite:///${CHECK_DB}"

echo "pre-push: applying migrations to temporary database..."
.venv/bin/alembic upgrade head

echo "pre-push: checking migration history matches SQLAlchemy models..."
.venv/bin/alembic check

HEAD_COUNT="$(.venv/bin/alembic heads | grep -c '(head)' || true)"
if [[ "$HEAD_COUNT" -ne 1 ]]; then
	echo "pre-push: expected a single migration head, found ${HEAD_COUNT}." >&2
	.venv/bin/alembic heads >&2 || true
	exit 1
fi

echo "pre-push: migration history is in sync."
