# raise-summit-hackathon-soai-2026

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

5. Apply database migrations:

	```bash
	poetry run alembic upgrade head
	```

6. Run the backend server:

	```bash
	poetry run uvicorn main:app --reload --host 127.0.0.1 --port 8080
	```

	Or use the helper script:

	```bash
	./run-dev.sh
	```

The server will start on `http://127.0.0.1:8080` by default.

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

Schema changes are managed with [Alembic](https://alembic.sqlalchemy.org/) in `backend/alembic/`.

Apply migrations locally:

```bash
cd backend
poetry run alembic upgrade head
```

Create a new migration after changing SQLAlchemy models in `models/clients/`:

```bash
cd backend
poetry run alembic revision --autogenerate -m "describe your change"
poetry run alembic upgrade head
```

Check that models and migration history are in sync:

```bash
./scripts/check-migrations.sh
```

Register ORM models in `models/clients/` and import them from `models/clients/__init__.py` so autogenerate can detect them.

### Git hooks

A pre-push hook verifies that migration history matches the current SQLAlchemy models before code is pushed.

Enable it once after cloning:

```bash
./scripts/setup-git-hooks.sh
```

The hook runs `scripts/check-migrations.sh`, which:

1. Applies migrations to a temporary SQLite database
2. Runs `alembic check` to fail if a new autogenerate migration is needed
3. Ensures there is a single migration head (no branched history)

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

The app will start on `http://localhost:5173` by default and is configured to talk to the backend at `http://127.0.0.1:8080`.

`frontend/node_modules/` is gitignored. After cloning the repo, run `npm install` to recreate it locally.
