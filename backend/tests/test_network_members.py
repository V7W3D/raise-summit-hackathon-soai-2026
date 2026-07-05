"""Tests for Scouter network member matching."""

from services.network_members import (
	enrich_lead_dict,
	load_network_directory,
	match_lead,
	normalize_company_domain,
)
from models.clients.leads import Lead


def test_normalize_company_domain_from_website():
	assert normalize_company_domain("https://www.rhoneplomberie.fr/contact") == "rhoneplomberie.fr"


def test_normalize_company_domain_from_email():
	assert normalize_company_domain("", "contact@btprhone.fr") == "btprhone.fr"


def test_match_lead_to_network_member(db_session):
	from database.seed import _ensure_network_members

	_ensure_network_members(db_session)
	db_session.commit()

	directory = load_network_directory(db_session)
	match = match_lead(db_session, website="rhoneplomberie.fr", directory=directory)
	assert match is not None
	assert match.business_name == "Rhône Plomberie"
	assert match.badge == "verified"


def test_enrich_lead_dict_flags_network_member(db_session):
	from database.seed import _ensure_network_members

	_ensure_network_members(db_session)
	lead = Lead(
		mission_id=1,
		name="Rhône Plomberie",
		website="rhoneplomberie.fr",
		email="contact@rhoneplomberie.fr",
	)
	payload = enrich_lead_dict(db_session, lead)
	assert payload["is_network_member"] is True
	assert payload["network_badge"] == "verified"
