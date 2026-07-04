from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from database.dependencies import DbSession
from models.schemas.home import HomeDashboard
from services import dashboard as dashboard_service
from services import users as user_service

router = APIRouter(prefix="/home", tags=["home"])


@router.get("/dashboard", response_model=HomeDashboard)
def get_dashboard(db: DbSession):
	user = user_service.get_default_user(db)
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail="Database not seeded. Run: python -m database.seed",
		)
	return dashboard_service.build_dashboard(db, user)
