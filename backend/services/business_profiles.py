from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.clients.business_profiles import BusinessProfile
from models.clients.user_mission_links import UserMissionLink
from models.schemas.business_profiles import BusinessProfileCreate, BusinessProfileUpdate
from search_agent.schemas import BusinessProfile as AgentBusinessProfile


class BusinessProfileNotFoundError(LookupError):
	"""Raised when a user or mission has no persisted business profile."""


def get_business_profile_for_user(db: Session, user_id: int) -> BusinessProfile | None:
	return db.scalar(select(BusinessProfile).where(BusinessProfile.user_id == user_id))


def get_business_profile_for_mission(db: Session, mission_id: int) -> BusinessProfile | None:
	user_id = db.scalar(
		select(UserMissionLink.user_id).where(UserMissionLink.mission_id == mission_id)
	)
	if user_id is None:
		return None
	return get_business_profile_for_user(db, user_id)


def create_business_profile(
	db: Session, payload: BusinessProfileCreate, *, user_id: int
) -> BusinessProfile:
	profile = BusinessProfile(**payload.model_dump(), user_id=user_id)
	db.add(profile)
	db.commit()
	db.refresh(profile)
	return profile


def update_business_profile(
	db: Session, profile: BusinessProfile, payload: BusinessProfileUpdate
) -> BusinessProfile:
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(profile, field, value)
	db.commit()
	db.refresh(profile)
	return profile


def business_profile_to_agent(profile: BusinessProfile) -> AgentBusinessProfile:
	return AgentBusinessProfile(
		business_id=str(profile.id),
		business_name=profile.business_name,
		business_type=profile.business_type,
		description=profile.description,
		what_we_sell=profile.what_we_sell,
		value_proposition=profile.value_proposition,
		target_geographies=list(profile.target_geographies or []),
		ideal_customers=list(profile.ideal_customers or []),
		bad_fit_customers=list(profile.bad_fit_customers or []),
		preferred_tone=profile.preferred_tone,
		languages=list(profile.languages or []),
	)


def resolve_agent_business_profile(
	db: Session,
	*,
	user_id: int | None = None,
	mission_id: int | None = None,
) -> AgentBusinessProfile:
	profile = None
	if user_id is not None:
		profile = get_business_profile_for_user(db, user_id)
	elif mission_id is not None:
		profile = get_business_profile_for_mission(db, mission_id)

	if profile is None:
		raise BusinessProfileNotFoundError("Business profile not found for this user or mission")

	return business_profile_to_agent(profile)
