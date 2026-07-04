from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models.clients  # noqa: F401  (register ORM models on Base.metadata)
from database.base import Base
from database.session import engine
from routers import business_profiles, home, leads, missions
from routers.search_agent import router as search_agent_router


@asynccontextmanager
async def lifespan(app: FastAPI):
	# Create tables on startup for local/dev use. Alembic owns production schema.
	Base.metadata.create_all(bind=engine)
	yield


app = FastAPI(title="Raise Summit Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"http://localhost:5174",
		"http://127.0.0.1:5174",
	],
	allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(home.router)
app.include_router(business_profiles.router)
app.include_router(missions.router)
app.include_router(leads.router)
app.include_router(search_agent_router)


@app.get("/")
async def root() -> dict[str, str]:
	return {"message": "Backend is running"}


@app.get("/health")
async def health_check() -> dict[str, str]:
	return {"status": "ok"}
