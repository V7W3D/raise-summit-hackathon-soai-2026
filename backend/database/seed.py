"""Seed the database with demo data matching the ProspectPath mockups.

Run with (from the backend directory):
  poetry run python -m database.seed
Pass --reset to drop and recreate all tables first.
"""

from __future__ import annotations

import sys

from sqlalchemy import select, text

import models.clients  # noqa: F401  (register ORM models)
from database.base import Base
from database.session import SessionLocal, engine
from models.clients.leads import Lead
from models.clients.missions import Mission
from models.clients.user_mission_links import UserMissionLink
from models.clients.users import User
from models.clients.business_profiles import BusinessProfile

DEFAULT_USER = {
	"name": "Azzedine",
	"email": "azzedine@prospectpath.com",
}

DEFAULT_BUSINESS_PROFILE = {
	"business_name": "CallPilot AI",
	"business_type": "B2B SaaS",
	"what_we_sell": "AI phone receptionist for small service businesses",
	"target_geographies": ["France"],
	"ideal_customers": ["small local service companies that receive many calls"],
	"bad_fit_customers": [
		"very large enterprises",
		"businesses with no phone-based workflow",
	],
	"languages": ["fr"],
}

MISSIONS = [
	{
		"name": "Construction Clients – Lyon",
		"target": "Target: small service businesses",
		"location": "Lyon, France",
		"progress": 36,
		"description": (
			"Find small construction service businesses in Lyon likely to "
			"need AI call reception."
		),
		"target_industry": "construction",
		"language": "fr",
	},
	{
		"name": "Seafood Suppliers – Paris",
		"target": "Target: premium seafood suppliers",
		"location": "Paris, France",
		"progress": 33,
		"description": "Find premium seafood suppliers serving Paris restaurants.",
		"target_industry": "seafood",
		"language": "fr",
	},
	{
		"name": "Accounting Consultants – Bakery Network",
		"target": "Target: small business accounting advisors",
		"location": "France",
		"progress": 22,
		"description": "Find accounting consultants for a bakery owner network.",
		"target_industry": "accounting",
		"language": "fr",
	},
	{
		"name": "Strategic Partners – E-commerce",
		"target": "Target: logistics & payment partners",
		"location": "France & Europe",
		"progress": 46,
		"description": "Find logistics and payment partners for e-commerce brands.",
		"target_industry": "e-commerce",
	},
	{
		"name": "Investors – Food Tech Startups",
		"target": "Target: early-stage impact investors",
		"location": "Europe",
		"progress": 20,
		"description": "Find early-stage impact investors in food tech.",
		"target_industry": "food tech",
	},
]

# Leads belong to the first mission (Construction Clients – Lyon).
LEADS = [
	{
		"name": "Rhône Plomberie",
		"description": "Local emergency plumbing and repair company",
		"location": "Lyon, France",
		"website": "rhoneplomberie.fr",
		"email": "contact@rhoneplomberie.fr",
		"phone": "04 78 123 456",
		"score": 84,
		"status": "approved",
		"tracking_status": "contacted",
		"why": [
			"Local plumbing company in Lyon",
			"Emergency service mentioned",
			"Strong phone-first workflow",
			"Active website",
		],
		"missing": ["No named operations manager"],
		"recommended": ["Short email + phone follow-up"],
		"evidence": [
			{
				"quote": "Intervention d'urgence 24h/24 et 7j/7 pour tous vos problèmes de plomberie à Lyon et ses environs.",
				"source": "Homepage",
			},
			{
				"quote": "Plombier à Lyon — dépannage rapide, installation, fuite d'eau, débouchage, chauffe-eau…",
				"source": "Homepage",
			},
			{
				"quote": "Appelez-nous au 04 78 123 456 pour une intervention rapide. Devis gratuit.",
				"source": "Contact page",
			},
		],
		"sources_scanned": [
			{"label": "Homepage scanned", "time": "2 min ago"},
			{"label": "About page scanned", "time": "3 min ago"},
			{"label": "Services page scanned", "time": "3 min ago"},
			{"label": "Contact page scanned", "time": "2 min ago"},
		],
	},
	{
		"name": "BTP Rhône Services",
		"description": "General construction & renovation services",
		"location": "Lyon, France",
		"website": "btprhone.fr",
		"email": "contact@btprhone.fr",
		"phone": "04 72 000 000",
		"score": 72,
		"status": "approved",
		"tracking_status": "to_contact",
		"why": ["Emergency & maintenance", "20+ years in business", "Local team in Lyon"],
		"missing": ["No pricing on website"],
		"recommended": ["Intro email with case study"],
		"evidence": [],
		"sources_scanned": [],
	},
	{
		"name": "EcoBuild Lyon",
		"description": "Sustainable construction & eco-renovation",
		"location": "Lyon, France",
		"website": "ecobuild-lyon.fr",
		"email": "",
		"phone": "",
		"score": 66,
		"status": "approved",
		"tracking_status": "replied",
		"why": ["Eco-focused positioning", "Residential & small projects", "Active blog & news"],
		"missing": ["No direct phone number", "Team page limited"],
		"recommended": ["Verify phone & response time"],
		"evidence": [],
		"sources_scanned": [],
	},
	{
		"name": "Artisan Toiture Plus",
		"description": "Roofing & roof repair specialists",
		"location": "Lyon, France",
		"website": "toitureplus.fr",
		"email": "",
		"phone": "04 78 555 111",
		"score": 61,
		"status": "approved",
		"tracking_status": "engaged",
		"why": ["Roofing specialists", "10+ years experience", "Local service area"],
		"missing": ["No email found"],
		"recommended": ["Find email & owner contact"],
		"evidence": [],
		"sources_scanned": [],
	},
	{
		"name": "Maison Rénov Experts",
		"description": "Renovation & home improvement",
		"location": "Lyon, France",
		"website": "maisonrenov-experts.fr",
		"email": "info@maisonrenov-experts.fr",
		"phone": "04 78 222 333",
		"score": 59,
		"why": ["Full renovation services", "Positive customer reviews", "Active social presence"],
		"missing": ["Website outdated"],
		"recommended": ["Re-verify activity & lead gen fit"],
		"evidence": [],
		"sources_scanned": [],
	},
]



def _apply_migrations() -> None:
	from pathlib import Path

	from alembic import command
	from alembic.config import Config

	cfg = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
	command.upgrade(cfg, "head")


def seed(reset: bool = False) -> None:
	if reset:
		print("Dropping all tables…")
		Base.metadata.drop_all(bind=engine)
		with engine.begin() as conn:
			conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
	_apply_migrations()

	with SessionLocal() as db:
		user = db.scalar(select(User).limit(1))
		if user is None:
			user = User(**DEFAULT_USER)
			db.add(user)
			db.flush()
			print(f"Created user: {user.name}")

		profile = db.scalar(
			select(BusinessProfile).where(BusinessProfile.user_id == user.id)
		)
		if profile is None:
			db.add(BusinessProfile(**DEFAULT_BUSINESS_PROFILE, user_id=user.id))
			db.flush()
			print(f"Created business profile: {DEFAULT_BUSINESS_PROFILE['business_name']}")

		existing = db.scalar(select(Mission).limit(1))
		if existing is not None and not reset:
			db.commit()
			print("Missions already present — skipping seed. Use --reset to reseed.")
			return

		mission_objs: list[Mission] = []
		for data in MISSIONS:
			mission = Mission(**data)
			db.add(mission)
			mission_objs.append(mission)
		db.flush()
		for mission in mission_objs:
			db.add(UserMissionLink(user_id=user.id, mission_id=mission.id))
		db.flush()
		print(f"Created {len(mission_objs)} missions")

		lyon_mission = mission_objs[0]
		for data in LEADS:
			db.add(Lead(**data, mission_id=lyon_mission.id))
		db.flush()
		print(f"Created {len(LEADS)} leads for mission '{lyon_mission.name}'")

		db.commit()
		print("Seed complete.")


if __name__ == "__main__":
	seed(reset="--reset" in sys.argv)
