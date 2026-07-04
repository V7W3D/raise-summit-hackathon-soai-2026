from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from database.dependencies import DbSession
from models.schemas.business_profiles import BusinessProfileRead
from services import business_profiles as business_profile_service
from services import users as user_service

router = APIRouter(prefix="/business-profile", tags=["business-profile"])


@router.get("", response_model=BusinessProfileRead)
def get_business_profile(db: DbSession):
	user = user_service.get_default_user(db)
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail="Database not seeded. Run: python -m database.seed",
		)
	profile = business_profile_service.get_business_profile_for_user(db, user.id)
	if profile is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Business profile not found. Run: python -m database.seed",
		)
	return profile
