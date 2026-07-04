"""Deterministic search plan generator (no LLM).

Good enough for demos: expands well-known sectors into concrete segments,
picks personas per goal type, and builds query templates (French templates
when the mission targets France / French).
"""

from ..schemas import Mission, BusinessProfile, SearchAgentInput, SearchPlan
from ..utils import normalize_text

PERSONAS_BY_GOAL = {
    "find_clients": ["owner", "founder", "operations manager", "office manager", "director"],
    "find_suppliers": ["sales manager", "supplier manager", "distributor", "owner"],
    "find_consultants": ["independent consultant", "agency owner", "expert", "partner"],
    "find_partners": ["founder", "business development manager", "partner"],
    "find_investors": ["partner", "analyst", "principal", "angel"],
    "find_hires": ["hiring manager"],
}

GOOD_FIT_BY_GOAL = {
    "find_clients": [
        "local service business",
        "phone-first workflow",
        "emergency service",
        "active website",
    ],
    "find_suppliers": [
        "product availability",
        "delivery zone",
        "B2B",
        "certifications",
        "active website",
    ],
    "find_consultants": [
        "case studies",
        "service pages",
        "testimonials",
        "clear expertise",
    ],
    "find_partners": ["complementary offering", "shared audience", "active website"],
    "find_investors": ["sector thesis", "region match", "stage match", "portfolio fit"],
    "find_hires": [],
}

DEFAULT_BAD_FIT = [
    "very large enterprise",
    "national group",
    "inactive website",
    "no phone-based workflow",
]

# Sector keyword -> concrete local-business segments (French market focus).
SECTOR_EXPANSIONS: dict[str, list[str]] = {
    "construction": [
        "plombier",
        "électricien",
        "chauffagiste",
        "couvreur",
        "entreprise de rénovation",
        "maçonnerie",
        "dépannage bâtiment",
    ],
    "plumbing": ["plombier", "dépannage plomberie"],
    "restaurant": ["restaurant", "traiteur", "food truck"],
    "beauty": ["salon de coiffure", "institut de beauté", "barbier"],
    "automotive": ["garage automobile", "carrosserie", "dépannage auto"],
    "cleaning": ["entreprise de nettoyage", "société de ménage"],
    "medical": ["cabinet médical", "cabinet dentaire", "kinésithérapeute"],
    "legal": ["cabinet d'avocats", "notaire"],
}

FRENCH_HINTS = ("france", "paris", "lyon", "marseille", "toulouse", "bordeaux",
                "lille", "nantes", "nice", "strasbourg", "french", "français")


def _is_french_market(profile: BusinessProfile, mission: Mission) -> bool:
    haystack = normalize_text(
        " ".join(
            [
                mission.language or "",
                mission.target_location or "",
                *profile.target_geographies,
                *profile.languages,
            ]
        )
    )
    return "fr" == (mission.language or "").lower() or any(
        hint in haystack for hint in FRENCH_HINTS
    )


def _expand_segments(profile: BusinessProfile, mission: Mission) -> list[str]:
    haystack = normalize_text(
        " ".join([mission.description, mission.target_industry or ""])
    )
    segments: list[str] = []
    for sector, expansion in SECTOR_EXPANSIONS.items():
        if sector in haystack:
            segments.extend(expansion)
    if not segments and mission.target_industry:
        segments.append(mission.target_industry)
    if not segments:
        # Last resort: reuse the ideal customer descriptions as segments.
        segments.extend(profile.ideal_customers[:3] or ["local business"])
    # Dedupe while preserving order.
    return list(dict.fromkeys(segments))


def build_fallback_plan(agent_input: SearchAgentInput) -> SearchPlan:
    profile = agent_input.business_profile
    mission = agent_input.mission
    options = agent_input.search_options

    goal = mission.goal_type
    location = mission.target_location or (
        profile.target_geographies[0] if profile.target_geographies else ""
    )
    french = _is_french_market(profile, mission)
    segments = _expand_segments(profile, mission)

    good_fit = list(GOOD_FIT_BY_GOAL.get(goal, []))
    bad_fit = list(dict.fromkeys(profile.bad_fit_customers + DEFAULT_BAD_FIT))

    queries: list[str] = []
    if goal == "find_hires":
        # Candidate scraping from job platforms is out of scope on purpose.
        queries = [f"{mission.description} company website {location}".strip()]
    else:
        for segment in segments:
            queries.append(f"{segment} {location} contact".strip())
            if french:
                queries.append(f"{segment} {location} téléphone devis".strip())
                queries.append(f"{segment} urgence {location}".strip())
            else:
                queries.append(f"{segment} {location} phone quote".strip())
        if french:
            queries.append(f"annuaire {segments[0]} {location}".strip())
        else:
            queries.append(f"{segments[0]} directory {location}".strip())

    queries = list(dict.fromkeys(q for q in queries if q))[: options.max_queries]

    interpreted = (
        f"{goal.replace('_', ' ').capitalize()} for {profile.business_name}: "
        f"{mission.description}"
    )

    assumptions = [
        "Search plan generated deterministically (no LLM).",
        f"Market language assumed {'French' if french else 'English'}.",
    ]
    if location:
        assumptions.append(f"Geography narrowed to {location}.")

    return SearchPlan(
        interpreted_goal=interpreted,
        target_personas=PERSONAS_BY_GOAL.get(goal, ["owner"]),
        target_segments=segments,
        good_fit_signals=good_fit,
        bad_fit_signals=bad_fit,
        suggested_sources=list(options.include_sources),
        generated_queries=queries,
        assumptions=assumptions,
    )
