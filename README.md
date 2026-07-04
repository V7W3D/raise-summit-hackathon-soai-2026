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