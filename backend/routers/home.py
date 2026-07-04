from __future__ import annotations

from fastapi import APIRouter

from database.dependencies import DbSession
from models.schemas.home import HomeDashboard
from services import dashboard as dashboard_service
from services import users as user_service

router = APIRouter(prefix="/home", tags=["home"])


@router.get("/dashboard", response_model=HomeDashboard)
def get_dashboard(db: DbSession):
	user = user_service.get_or_create_default_user(db)
	return dashboard_service.build_dashboard(db, user)
