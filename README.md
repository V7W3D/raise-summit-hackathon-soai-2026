# raise-summit-hackathon-soai-2026

## Backend setup

The backend lives in `backend/` and uses Poetry to manage its virtual environment and dependencies.

1. Go to the backend folder:

	```bash
	cd backend
	```

2. Install the dependencies and create the virtual environment:

	```bash
	poetry install
	```

3. Run the backend server with Uvicorn:

	```bash
	poetry run uvicorn main:app --reload
	```

The server will start on `http://127.0.0.1:8000` by default.

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

The app will start on `http://localhost:5173` by default and will check the FastAPI backend at `http://127.0.0.1:8000/health`.