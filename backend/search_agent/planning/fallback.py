"""Deterministic search plan generator (no LLM).

Builds queries from the mission's explicit target and signals first.
Profile ideal customers are only used when the mission has no target.
"""

from ..schemas import Mission, BusinessProfile, SearchAgentInput, SearchPlan
from ..utils import normalize_text

DEFAULT_PERSONAS = [
    "owner",
    "founder",
    "operations manager",
    "office manager",
    "director",
]

DEFAULT_BAD_FIT = [
    "very large enterprise",
    "national group",
    "inactive website",
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
    "social media": [
        "agence social media",
        "community management",
        "agence communication digitale",
    ],
    "social": [
        "agence social media",
        "community manager",
        "agence digitale",
    ],
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


def _expand_from_sector_keywords(haystack: str) -> list[str]:
    segments: list[str] = []
    for sector, expansion in SECTOR_EXPANSIONS.items():
        if sector in haystack:
            segments.extend(expansion)
    return segments


def _expand_segments(profile: BusinessProfile, mission: Mission) -> list[str]:
    segments: list[str] = []

    if mission.target_industry:
        segments.append(mission.target_industry.strip())

    for signal in mission.trigger_signals or []:
        cleaned = signal.strip()
        if cleaned and cleaned not in segments:
            segments.append(cleaned)

    haystack = normalize_text(
        " ".join(
            [
                mission.description,
                mission.target_industry or "",
                *mission.trigger_signals,
            ]
        )
    )
    segments.extend(_expand_from_sector_keywords(haystack))

    if not segments:
        segments.extend(profile.ideal_customers[:3] or ["local business"])

    return list(dict.fromkeys(s for s in segments if s))


def build_fallback_plan(agent_input: SearchAgentInput) -> SearchPlan:
    profile = agent_input.business_profile
    mission = agent_input.mission
    options = agent_input.search_options

    location = mission.target_location or (
        profile.target_geographies[0] if profile.target_geographies else ""
    )
    french = _is_french_market(profile, mission)
    segments = _expand_segments(profile, mission)

    good_fit = list(dict.fromkeys(mission.trigger_signals or []))
    bad_fit = list(
        dict.fromkeys(
            list(mission.negative_filters or [])
            + list(profile.bad_fit_customers)
            + DEFAULT_BAD_FIT
        )
    )

    queries: list[str] = []
    for segment in segments:
        queries.append(f"{segment} {location} contact".strip())
        if french:
            queries.append(f"{segment} {location} email".strip())
            queries.append(f"{segment} {location} agence".strip())
        else:
            queries.append(f"{segment} {location} email".strip())
    if segments:
        if french:
            queries.append(f"annuaire {segments[0]} {location}".strip())
        else:
            queries.append(f"{segments[0]} directory {location}".strip())

    queries = list(dict.fromkeys(q for q in queries if q))[: options.max_queries]

    target_label = mission.target_industry or "prospects"
    interpreted = (
        f"Find {target_label} in {location or 'target area'}: {mission.description}"
    )

    assumptions = [
        "Search plan generated deterministically (no LLM).",
        f"Market language assumed {'French' if french else 'English'}.",
        f"Targeting driven by mission target: {target_label}.",
    ]
    if location:
        assumptions.append(f"Geography narrowed to {location}.")

    personas = list(mission.buyer_roles or DEFAULT_PERSONAS)
    if not personas:
        personas = list(DEFAULT_PERSONAS)

    return SearchPlan(
        interpreted_goal=interpreted,
        target_personas=personas,
        target_segments=segments,
        good_fit_signals=good_fit,
        bad_fit_signals=bad_fit,
        suggested_sources=list(options.include_sources),
        generated_queries=queries,
        assumptions=assumptions,
    )
