"""Run the search agent for a persisted mission and write leads to the DB."""

from __future__ import annotations

import os
import uuid
from typing import TYPE_CHECKING

from sqlalchemy.orm import Session

from models.schemas.leads import LeadCreate
from search_agent import run_search_agent
from search_agent.errors import ProviderNotConfiguredError
from search_agent.fetching import PageFetcher
from search_agent.providers import SearchProvider
from search_agent.schemas import (
	BusinessProfile,
	CandidateLead,
	Evidence,
	Mission as AgentMission,
	ProviderOptions,
	SearchAgentInput,
	SearchAgentOutput,
	SearchOptions,
)
from search_agent.view_models.discover_card import ACTION_LABELS
from services.leads import create_leads
from services.business_profiles import resolve_agent_business_profile
from services.missions import get_mission

if TYPE_CHECKING:
	from models.clients.leads import Lead
	from models.clients.missions import Mission


def resolve_provider_options(
	provider_options: ProviderOptions | None = None,
) -> ProviderOptions:
	if provider_options is not None:
		return provider_options

	provider = os.environ.get("SEARCH_PROVIDER", "").strip().strip('"').strip("'")
	if not provider:
		raise ProviderNotConfiguredError(
			"SEARCH_PROVIDER is not set. Configure one of: tavily, exa, brave, serper, fixture"
		)
	return ProviderOptions(provider=provider)  # type: ignore[arg-type]


def mission_to_agent_mission(mission: Mission) -> AgentMission:
	"""Map a DB mission row to the search agent mission contract."""
	location = mission.location.strip()
	return AgentMission(
		mission_id=str(mission.id),
		title=mission.name,
		description=mission.description,
		target_location=location or None,
		target_industry=mission.target_industry,
		target_business_size=mission.target_business_size,
		desired_lead_count=mission.desired_lead_count,
		urgency=mission.urgency,  # type: ignore[arg-type]
		language=mission.language,
	)


def mission_to_agent_input(
	mission: Mission,
	*,
	request_id: str,
	business_profile: BusinessProfile,
	search_options: SearchOptions | None = None,
	provider_options: ProviderOptions | None = None,
) -> SearchAgentInput:
	"""Map a DB mission row to the search agent input contract."""
	return SearchAgentInput(
		request_id=request_id,
		business_profile=business_profile,
		mission=mission_to_agent_mission(mission),
		search_options=search_options or SearchOptions(),
		provider_options=provider_options,
	)


def _website_for_db(candidate: CandidateLead) -> str:
	if candidate.domain:
		return candidate.domain
	url = (candidate.website_url or "").strip()
	for prefix in ("https://", "http://"):
		if url.startswith(prefix):
			url = url[len(prefix) :]
	return url.rstrip("/")


def _primary_email(candidate: CandidateLead) -> str:
	if not candidate.contact.emails:
		return ""
	personal = next((e.value for e in candidate.contact.emails if e.type == "personal"), None)
	return personal or candidate.contact.emails[0].value


def _primary_phone(candidate: CandidateLead) -> str:
	if not candidate.contact.phones:
		return ""
	return candidate.contact.phones[0].value


def _evidence_for_db(evidence: Evidence) -> dict[str, str]:
	source = evidence.title or evidence.source_url
	return {"quote": evidence.snippet, "source": source}


def _recommended_for_db(candidate: CandidateLead) -> list[str]:
	action = candidate.classification.recommended_next_action
	label = ACTION_LABELS.get(action, "Open details")
	return [label]


def _sources_scanned_for_db(candidate: CandidateLead) -> list[dict[str, str]]:
	entries: list[dict[str, str]] = []
	for url in candidate.source_urls:
		label = candidate.domain or url.replace("https://", "").replace("http://", "")
		entries.append({"label": f"{label} scanned", "time": ""})
	if candidate.source_provider:
		entries.append({"label": f"Provider: {candidate.source_provider}", "time": ""})
	return entries


def candidate_to_lead_create(candidate: CandidateLead, mission_id: int) -> LeadCreate:
	"""Map a search agent candidate to the persisted lead schema."""
	score = int(round(candidate.scores.overall_score))
	score = max(0, min(100, score))
	description = (candidate.short_description or "")[:255]
	return LeadCreate(
		mission_id=mission_id,
		name=candidate.name[:160],
		description=description,
		location=(candidate.location or "")[:120],
		website=_website_for_db(candidate)[:255],
		email=_primary_email(candidate)[:255],
		phone=_primary_phone(candidate)[:60],
		score=score,
		why=list(candidate.classification.reasons),
		missing=list(candidate.classification.missing_info),
		recommended=_recommended_for_db(candidate),
		evidence=[_evidence_for_db(item) for item in candidate.evidence],
		sources_scanned=_sources_scanned_for_db(candidate),
	)


def run_search_for_mission(
	db: Session,
	mission_id: int,
	*,
	user_id: int | None = None,
	request_id: str | None = None,
	business_profile: BusinessProfile | None = None,
	search_options: SearchOptions | None = None,
	provider_options: ProviderOptions | None = None,
	provider: SearchProvider | None = None,
	fetcher: PageFetcher | None = None,
	persist: bool = True,
	progress_callback=None,
) -> tuple[SearchAgentOutput, list[Lead]] | None:
	"""Fetch a mission from the DB, run the search agent, and persist leads.

	Returns ``None`` when the mission does not exist.
	"""
	mission = get_mission(db, mission_id)
	if mission is None:
		return None

	if business_profile is None:
		business_profile = resolve_agent_business_profile(
			db, user_id=user_id, mission_id=mission_id
		)

	resolved_request_id = request_id or f"req_{uuid.uuid4().hex[:12]}"
	if provider_options is None and provider is None:
		provider_options = resolve_provider_options(None)
	elif provider_options is None:
		# Placeholder only; an injected provider bypasses create_provider().
		provider_options = ProviderOptions(provider="tavily")

	agent_input = mission_to_agent_input(
		mission,
		request_id=resolved_request_id,
		business_profile=business_profile,
		search_options=search_options,
		provider_options=provider_options,
	)

	output = run_search_agent(
		agent_input,
		provider=provider,
		fetcher=fetcher,
		progress_callback=progress_callback,
	)

	leads: list[Lead] = []
	if persist and output.candidates:
		# Re-runs must not duplicate leads: skip websites already saved.
		known_websites = {lead.website for lead in mission.leads if lead.website}
		payloads = []
		for candidate in output.candidates:
			payload = candidate_to_lead_create(candidate, mission_id)
			if payload.website and payload.website in known_websites:
				continue
			known_websites.add(payload.website)
			payloads.append(payload)
		if payloads:
			leads = create_leads(db, payloads)

	return output, leads
