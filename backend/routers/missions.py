from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from database.dependencies import DbSession
from models.schemas.prospect_segments import ProspectSegmentsResponse
from models.schemas.target_keywords import TargetKeywordsResponse
from models.schemas.mission_assist import MissionAssistRequest, MissionAssistResponse
from models.schemas.mission_preview import (
	MissionPreviewRequest,
	MissionPreviewResponse,
	MissionSuggestionsResponse,
	build_mission_preview,
	build_mission_suggestions,
)
from models.schemas.missions import MissionCreate, MissionRead, MissionUpdate
from services import missions as mission_service
from services import users as user_service
from services.business_profiles import BusinessProfileNotFoundError, get_business_profile_for_user
from services.mission_llm import (
	MissionLLMError,
	generate_fallback_assist,
	generate_mission_assist,
	generate_prospect_segments,
	generate_target_keywords,
	llm_available,
)
from services.mission_search import (
	MissionSearchAlreadyRunningError,
	start_mission_search,
)
from services.search_progress import get_progress
from search_agent.errors import ProviderNotConfiguredError

router = APIRouter(prefix="/missions", tags=["missions"])


def _require_default_user(db: DbSession):
	user = user_service.get_default_user(db)
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail="Database not seeded. Run: python -m database.seed",
		)
	return user


@router.get("", response_model=list[MissionRead])
def list_missions(db: DbSession, is_archived: bool = Query(default=False)):
	return mission_service.list_missions(db, is_archived=is_archived)


@router.get("/suggestions", response_model=MissionSuggestionsResponse)
def get_mission_suggestions(db: DbSession):
	user = _require_default_user(db)
	profile = get_business_profile_for_user(db, user.id)
	default_location = profile.target_geographies[0] if profile and profile.target_geographies else ""
	return build_mission_suggestions(
		ideal_customers=profile.ideal_customers if profile else None,
		business_type=profile.business_type if profile else None,
		profile_languages=profile.languages if profile else None,
		default_location=default_location,
	)


@router.get("/prospect-segments", response_model=ProspectSegmentsResponse)
def get_prospect_segments(db: DbSession):
	user = _require_default_user(db)
	profile = get_business_profile_for_user(db, user.id)
	profile_payload = None
	if profile:
		profile_payload = {
			"businessName": profile.business_name,
			"businessType": profile.business_type,
			"whatWeSell": profile.what_we_sell,
			"valueProposition": profile.value_proposition,
			"idealCustomers": profile.ideal_customers,
			"badFitCustomers": profile.bad_fit_customers,
			"targetGeographies": profile.target_geographies,
			"languages": profile.languages,
		}
	return generate_prospect_segments(business_profile=profile_payload)


@router.get("/target-keywords", response_model=TargetKeywordsResponse)
def get_target_keywords(db: DbSession):
	user = _require_default_user(db)
	profile = get_business_profile_for_user(db, user.id)
	profile_payload = None
	if profile:
		profile_payload = {
			"businessName": profile.business_name,
			"businessType": profile.business_type,
			"whatWeSell": profile.what_we_sell,
			"idealCustomers": profile.ideal_customers,
			"badFitCustomers": profile.bad_fit_customers,
			"targetGeographies": profile.target_geographies,
			"languages": profile.languages,
		}
	keywords, source = generate_target_keywords(business_profile=profile_payload)
	return TargetKeywordsResponse(keywords=keywords, source=source)


@router.post("/preview", response_model=MissionPreviewResponse)
def preview_mission(payload: MissionPreviewRequest):
	return build_mission_preview(payload)


@router.post("/assist", response_model=MissionAssistResponse)
def assist_mission(payload: MissionAssistRequest, db: DbSession):
	user = _require_default_user(db)
	profile = get_business_profile_for_user(db, user.id)
	profile_payload = None
	if profile:
		profile_payload = {
			"businessName": profile.business_name,
			"businessType": profile.business_type,
			"whatWeSell": profile.what_we_sell,
			"idealCustomers": profile.ideal_customers,
			"badFitCustomers": profile.bad_fit_customers,
			"targetGeographies": profile.target_geographies,
			"languages": profile.languages,
		}

	try:
		if llm_available():
			return generate_mission_assist(
				query=payload.query,
				business_profile=profile_payload,
				current_location=payload.current_location,
			)
		return generate_fallback_assist(
			query=payload.query,
			ideal_customers=profile.ideal_customers if profile else None,
			business_type=profile.business_type if profile else None,
		)
	except MissionLLMError as exc:
		message = str(exc)
		if "Describe who" in message:
			raise HTTPException(
				status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
				detail=message,
			) from None
		fallback = generate_fallback_assist(
			query=payload.query,
			ideal_customers=profile.ideal_customers if profile else None,
			business_type=profile.business_type if profile else None,
		)
		fallback.reasoning = f"{message} Using profile-based suggestions instead."
		fallback.source = "fallback"
		return fallback


@router.post("", response_model=MissionRead, status_code=status.HTTP_201_CREATED)
def create_mission(payload: MissionCreate, db: DbSession):
	user = _require_default_user(db)
	return mission_service.create_mission(db, payload, user_id=user.id)


@router.post("/{mission_id}/search", response_model=MissionRead)
def run_mission_search(mission_id: int, db: DbSession):
	user = _require_default_user(db)
	mission = mission_service.get_mission(db, mission_id)
	if mission is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	try:
		return start_mission_search(db, mission_id, user_id=user.id)
	except MissionSearchAlreadyRunningError as exc:
		raise HTTPException(
			status_code=status.HTTP_409_CONFLICT,
			detail=str(exc),
		) from None
	except BusinessProfileNotFoundError:
		raise HTTPException(
			status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
			detail=(
				"Business profile required before running search. "
				"Run: python -m database.seed"
			),
		) from None
	except ProviderNotConfiguredError as exc:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail=str(exc),
		) from None


@router.get("/{mission_id}/search-progress")
def get_mission_search_progress(mission_id: int, db: DbSession):
	mission = mission_service.get_mission(db, mission_id, active_only=False)
	if mission is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	return get_progress(mission_id)


@router.get("/{mission_id}", response_model=MissionRead)
def get_mission(mission_id: int, db: DbSession):
	mission = mission_service.get_mission(db, mission_id, active_only=False)
	if mission is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	return mission


@router.patch("/{mission_id}", response_model=MissionRead)
def update_mission(mission_id: int, payload: MissionUpdate, db: DbSession):
	mission = mission_service.get_mission(db, mission_id, active_only=False)
	if mission is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	return mission_service.update_mission(db, mission, payload)


@router.delete("/{mission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mission(mission_id: int, db: DbSession):
	mission = mission_service.get_mission(db, mission_id, active_only=False)
	if mission is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	mission_service.delete_mission(db, mission)
