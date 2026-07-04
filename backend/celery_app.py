from __future__ import annotations

import os
from pathlib import Path

from celery import Celery
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

_broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
_result_backend = os.getenv("CELERY_RESULT_BACKEND", _broker_url)

celery_app = Celery(
	"raise_summit",
	broker=_broker_url,
	backend=_result_backend,
	include=["tasks.mission_search"],
)

celery_app.conf.update(
	task_serializer="json",
	accept_content=["json"],
	result_serializer="json",
	timezone="UTC",
	enable_utc=True,
	task_track_started=True,
)
