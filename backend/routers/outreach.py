from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from database.dependencies import DbSession
from services import leads as lead_service
from services import missions as mission_service
from services import users as user_service
from services.business_profiles import get_business_profile_for_user
from services.mission_llm import MissionLLMError
from services.outreach_llm import (
	OUTREACH_ANGLES,
	generate_fallback_draft,
	generate_outreach_draft,
)

router = APIRouter(prefix="/outreach", tags=["outreach"])


class OutreachDraftRequest(BaseModel):
	lead_id: int
	channel: str = Field(default="email", pattern="^(email|linkedin|call)$")
	angle: str = Field(default="missed_calls")


class FollowupTouch(BaseModel):
	day: int
	channel: str
	goal: str
	message_idea: str


class OutreachDraftResponse(BaseModel):
	subject: str
	body: str
	why_now: str
	evidence_used: list[str]
	followup_hint: str
	followup_plan: list[FollowupTouch] = Field(default_factory=list)
	source: str


@router.post("/draft", response_model=OutreachDraftResponse)
def draft_outreach(payload: OutreachDraftRequest, db: DbSession):
	lead = lead_service.get_lead(db, payload.lead_id)
	if lead is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

	angle = payload.angle if payload.angle in OUTREACH_ANGLES else "missed_calls"
	mission = mission_service.get_mission(db, lead.mission_id, active_only=False)
	user = user_service.get_default_user(db)
	profile = get_business_profile_for_user(db, user.id) if user else None

	try:
		result = generate_outreach_draft(
			lead=lead,
			channel=payload.channel,
			angle=angle,
			mission=mission,
			business_profile=profile,
		)
	except MissionLLMError:
		result = generate_fallback_draft(
			lead=lead,
			channel=payload.channel,
			business_profile=profile,
		)

	return OutreachDraftResponse(**result)
