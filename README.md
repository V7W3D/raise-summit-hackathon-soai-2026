# raise-summit-hackathon-soai-2026

**ProspectPath** — an AI-assisted lead prospecting workspace. A FastAPI + SQLite
backend and a Vite + React frontend for Home, Missions, Discover, Lead Verification,
and Insights.

## Quick start

You need **Redis** running, then **three terminals** for the backend API, Celery worker,
and frontend.

### 1. Redis

Mission search runs in the background via Celery, which uses Redis as its message broker.

**Docker (recommended):**

```bash
docker run -d --name prospectpath-redis -p 6379:6379 redis:7
```

**Or install locally (Ubuntu/Debian):**

```bash
sudo apt update && sudo apt install -y redis-server
sudo systemctl start redis-server
```

Verify Redis is reachable:

```bash
redis-cli ping   # should print PONG
```

### 2. Backend (terminal 1)

```bash
cd backend
poetry install                       # first time only
cp .env.example .env                 # first time only
mkdir -p data                        # first time only
poetry run alembic upgrade head
poetry run python -m database.seed   # demo data; add --reset to reseed
poetry run uvicorn main:app --reload
```

API: `http://127.0.0.1:8000` · OpenAPI docs: `/docs`

### 3. Celery worker (terminal 2)

Start this **after Redis is running** and before clicking **Run agent** on a mission.

```bash
cd backend
poetry run celery -A celery_app worker --loglevel=info --pool=solo
```

Use `--pool=solo` with SQLite so the worker does not fork database connections.
The worker picks up search tasks, runs the search agent, writes leads to the DB,
and sets the mission `search_status` to `ready` when finished.

### 4. Frontend (terminal 3)

```bash
cd frontend
npm install                          # first time only
cp .env.example .env                 # first time only
npm run dev
```

App: `http://localhost:5173` · API URL from `frontend/.env` (`VITE_API_BASE_URL`,
default `http://127.0.0.1:8000`). If the backend is down, the UI falls back to
bundled demo data.

### Ports

| Service       | URL                      | Notes                              |
| ------------- | ------------------------ | ---------------------------------- |
| Backend       | `http://127.0.0.1:8000`  | FastAPI                            |
| Frontend      | `http://localhost:5173`  | Vite dev server                    |
| Redis         | `redis://localhost:6379` | Celery broker                      |
| Celery worker | —                        | `celery -A celery_app worker`      |

---

## Configuration

Copy `backend/.env.example` to `backend/.env` and fill in:

```bash
DATABASE_URL=sqlite:///./data/raise_summit.db

# Celery (required for Run agent)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Search agent (required for Run agent)
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=your_key_here
```

SQLite creates `backend/data/raise_summit.db` on first write. That file is gitignored.

---

## Database & migrations

Schema is managed with [Alembic](https://alembic.sqlalchemy.org/) in `backend/alembic/`.

```bash
cd backend
poetry run alembic upgrade head    # apply pending migrations
poetry run alembic current         # show current revision
```

Run `upgrade head` on first setup and after pulling new files in `backend/alembic/versions/`.

**Create a migration** after changing models in `models/clients/`:

```bash
cd backend
poetry run alembic revision --autogenerate -m "describe your change"
poetry run alembic upgrade head
```

Import new models from `models/clients/__init__.py` so autogenerate detects them.

**Reset demo data:** `poetry run python -m database.seed --reset`

---

## Git hooks

Install once from the repo root (requires `poetry install` in `backend/` first):

```bash
./scripts/setup-git-hooks.sh
```

The pre-push hook runs `./scripts/check-migrations.sh` to ensure migrations match
the SQLAlchemy models. Bypass in an emergency only: `git push --no-verify`.

---

## Project layout

| Path | Stack |
| ---- | ----- |
| `backend/` | Poetry, FastAPI, SQLAlchemy, Celery, Alembic |
| `frontend/` | Vite, React, TanStack Query |
| `backend/database/` | DB config, sessions, FastAPI `get_db` dependency |
| `backend/search_agent/` | Search agent pipeline |
| `backend/tasks/` | Celery tasks (mission search) |
