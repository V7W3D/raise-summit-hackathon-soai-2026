# raise-summit-hackathon-soai-2026

## Backend setup

The backend lives in `backend/` and uses Poetry to manage its virtual environment and dependencies.

1. Go to the backend folder:

	```bash
	cd backend
	```

2. Install the dependencies and create the local virtual environment (`.venv/`):

	```bash
	../.venv/bin/poetry install
	```

	> **Note:** If `poetry install` fails with a `canonicalize_version` / `strip_trailing_zero` error, your system Poetry is conflicting with packages in `~/.local`. Use the repo Poetry above, or run `PYTHONNOUSERSITE=1 poetry install` if you have Poetry 2.x installed separately.

3. Run the backend server with Uvicorn:

	```bash
	./run-dev.sh
	```

	Or without the helper script:

	```bash
	.venv/bin/uvicorn main:app --reload
	```

The server will start on `http://127.0.0.1:8080` by default.

## Frontend setup

The frontend lives in `frontend/` and uses Vite with React.

1. Go to the frontend folder:

	```bash
	cd frontend
	```

2. Install the dependencies:

	```bash
	npm install
	```

3. If you want the frontend to talk to the backend, set the API base URL in a local env file:

	```bash
	cp .env.example .env
	```

4. Run the frontend dev server:

	```bash
	npm run dev
	```

The app will start on `http://localhost:5173` by default and will check the FastAPI backend at `http://127.0.0.1:8080/health`.