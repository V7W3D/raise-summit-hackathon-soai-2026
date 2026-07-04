# raise-summit-hackathon-soai-2026

**ProspectPath** — an AI-assisted lead prospecting workspace. A FastAPI + SQLite
backend serves a Vite + React frontend covering Home, Missions, Discover, Lead
Verification, and Insights.

## Quick start — run the full stack

You need **three terminals**: backend API, Celery worker, and frontend.

### 1. Backend (terminal 1)

```bash
cd backend
poetry install                       # first time only
cp .env.example .env                 # first time only (skip if .env exists)
mkdir -p data                        # first time only
poetry run alembic upgrade head      # create the database schema
poetry run python -m database.seed   # load demo data (missions + leads)
poetry run uvicorn main:app --reload # start API on http://127.0.0.1:8000
```

The API is now live at `http://127.0.0.1:8000` (interactive docs at `/docs`).

> To reset the demo data at any time: `poetry run python -m database.seed --reset`

### 2. Celery worker (terminal 2)

Mission search runs in the background via Celery. You need **Redis** running locally
(e.g. `docker run -p 6379:6379 redis:7` or a local Redis install), then start a worker:

```bash
cd backend
poetry run celery -A celery_app worker --loglevel=info
```

When you create a mission, the API enqueues a search task; the worker runs the search
agent and updates the mission's `search_status` in the database when it finishes.

### 3. Frontend (terminal 3)

```bash
cd frontend
npm install                          # first time only
cp .env.example .env                 # first time only (points at the API)
npm run dev                          # start UI on http://localhost:5173
```

Open **http://localhost:5173**. The frontend reads its API URL from
`frontend/.env` (`VITE_API_BASE_URL`, default `http://127.0.0.1:8000`) and falls
back to bundled demo data if the backend is unreachable, so the UI always
renders.

### Ports at a glance

| Service       | URL                       | Notes                          |
| ------------- | ------------------------- | ------------------------------ |
| Backend       | `http://127.0.0.1:8000`   | FastAPI, OpenAPI docs at `/docs` |
| Redis         | `redis://localhost:6379`  | Celery broker (background search) |
| Celery worker | —                         | `celery -A celery_app worker`  |
| Frontend      | `http://localhost:5173`   | Vite dev server                |

---

## Backend setup

The backend lives in `backend/` and uses Poetry, FastAPI, and SQLAlchemy with a local SQLite database.

1. Go to the backend folder:

	```bash
	cd backend
	```

2. Install the dependencies and create the local virtual environment:

	```bash
	poetry install
	```

	Poetry creates `backend/.venv/` on your machine. That folder is gitignored and is not pushed to the remote repo.

3. Configure the database environment:

	```bash
	cp .env.example .env
	mkdir -p data
	```

	Your `backend/.env` should contain:

	```bash
	DATABASE_URL=sqlite:///./data/raise_summit.db
	```

4. Apply database migrations (see [Apply Alembic migrations](#apply-alembic-migrations)):

	```bash
	poetry run alembic upgrade head
	```

5. Run the backend server:

	```bash
	poetry run uvicorn main:app --reload
	```

The server will start on `http://127.0.0.1:8000` by default.

## Database setup (SQLite)

The backend uses a local **SQLite** database through **SQLAlchemy**. SQLite is file-based, so you do not need to install or run a separate database server.

### Local setup

From `backend/`:

```bash
cp .env.example .env
mkdir -p data
```

The first time the backend writes to the database, SQLite creates `backend/data/raise_summit.db` on your machine.

### Database client

Database access lives in `backend/database/`:

- `config.py` — loads `DATABASE_URL` from `backend/.env`
- `session.py` — SQLAlchemy engine with a connection pool and `SessionLocal` session factory
- `dependencies.py` — `get_db()` FastAPI dependency and `DbSession` type alias
- `base.py` — shared SQLAlchemy `Base` class for ORM models

Use the dependency in routers to inject a database session per request:

```python
from fastapi import APIRouter

from database import DbSession

router = APIRouter()

@router.get("/leads")
def list_leads(db: DbSession):
	...
```

Each request gets its own session from the pool. The session is closed automatically after the request finishes.

### Migrations (Alembic)

Schema changes are managed with [Alembic](https://alembic.sqlalchemy.org/) in `backend/alembic/`. Migration files live in `backend/alembic/versions/` and are committed to the repo.

#### Apply Alembic migrations

Run this from `backend/` whenever you set up the project or pull migration changes from git.

1. Make sure your env and data folder exist:

	```bash
	cd backend
	cp .env.example .env   # skip if you already have .env
	mkdir -p data
	```

2. Apply every pending migration up to the latest revision:

	```bash
	poetry run alembic upgrade head
	```

	`upgrade head` runs all migrations that have not been applied yet and updates `backend/data/raise_summit.db` to match the current schema.

3. Confirm the database is at the latest revision:

	```bash
	poetry run alembic current
	```

	You should see the most recent revision id from `backend/alembic/versions/`.

**When to run it**

- First time setting up the backend locally
- After `git pull` when new files appear in `backend/alembic/versions/`
- Before starting the API if schema changes were merged but not applied yet

**After pulling changes**

```bash
cd backend
poetry install                  # if dependencies changed
poetry run alembic upgrade head # apply new migrations
```

If `upgrade head` succeeds, your local SQLite file matches the migration history in the repo.

#### Create a new migration

After changing SQLAlchemy models in `models/clients/`:

```bash
cd backend
poetry run alembic revision --autogenerate -m "describe your change"
poetry run alembic upgrade head
```

Register ORM models in `models/clients/` and import them from `models/clients/__init__.py` so autogenerate can detect them.

#### Check migration history

Verify that models and migration history are in sync:

```bash
./scripts/check-migrations.sh
```

### Git hooks

A **pre-push** hook blocks `git push` when migration history is out of sync with the SQLAlchemy models.

#### Install the pre-push hook

Run this once from the repo root after cloning:

```bash
./scripts/setup-git-hooks.sh
```

That command configures git to use the hooks in `.githooks/`:

```bash
git config core.hooksPath .githooks
```

**Before installing**, make sure the backend environment is ready:

```bash
cd backend
poetry install
```

The hook needs `backend/.venv/bin/alembic` to run migration checks.

#### Verify the hook is installed

From the repo root:

```bash
git config --get core.hooksPath
```

Expected output:

```text
.githooks
```

You can also run the check manually without pushing:

```bash
./scripts/check-migrations.sh
```

#### What happens on push

When you run `git push`, the pre-push hook runs `scripts/check-migrations.sh`, which:

1. Applies migrations to a temporary SQLite database
2. Runs `alembic check` to fail if a new autogenerate migration is needed
3. Ensures there is a single migration head (no branched history)

If any step fails, the push is blocked. Fix the issue, commit any missing migration files, and push again.

**Common fixes when the hook fails**

- Model changes exist but no migration was created:

	```bash
	cd backend
	poetry run alembic revision --autogenerate -m "describe your change"
	poetry run alembic upgrade head
	git add alembic/versions/
	git commit -m "Add migration for model changes"
	```

- Backend dependencies are missing:

	```bash
	cd backend
	poetry install
	```

#### Skip the hook (emergency only)

To push without running the hook:

```bash
git push --no-verify
```

Use this only when you intentionally need to bypass the check.

### Notes

- `backend/.env`, `backend/data/`, and `*.db` files are gitignored and stay local to your machine.
- Do not commit the `.db` file; teammates recreate it locally with the steps above.
- SQLite is included with Python, so no extra database install is required.

## Frontend setup

The frontend lives in `frontend/` and uses Vite with React, axios, and TanStack Query.

1. Go to the frontend folder:

	```bash
	cd frontend
	```

2. Install the dependencies:

	```bash
	npm install
	```

3. Set the API base URL in a local env file:

	```bash
	cp .env.example .env
	```

4. Run the frontend dev server:

	```bash
	npm run dev
	```

The app will start on `http://localhost:5173` by default and is configured to talk to the backend at `http://127.0.0.1:8000`.

`frontend/node_modules/` is gitignored. After cloning the repo, run `npm install` to recreate it locally.
