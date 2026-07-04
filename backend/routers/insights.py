from __future__ import annotations

from fastapi import APIRouter, Query

from database.dependencies import DbSession
from models.schemas.insights import InsightsReport
from services import insights as insights_service

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("", response_model=InsightsReport)
def get_insights(db: DbSession, mission_id: int | None = Query(default=None)):
	return insights_service.build_insights(db, mission_id)
