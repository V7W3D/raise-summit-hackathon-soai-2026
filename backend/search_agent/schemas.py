"""Typed input/output contracts for the Search Agent.

All models serialize to camelCase JSON (the contract used by the future
frontend) while Python code uses snake_case attributes.
"""

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ---------------------------------------------------------------------------
# Input contract
# ---------------------------------------------------------------------------

GoalType = Literal[
    "find_clients",
    "find_suppliers",
    "find_consultants",
    "find_partners",
    "find_investors",
    "find_hires",
]

SourceKind = Literal["web", "maps", "directories", "linkedin_public", "user_urls"]

ProviderName = Literal["mock", "exa", "tavily", "brave", "serper", "custom"]


class BusinessProfile(CamelModel):
    business_id: str
    business_name: str
    business_type: Optional[str] = None
    description: Optional[str] = None
    what_we_sell: str
    value_proposition: Optional[str] = None
    target_geographies: list[str] = Field(default_factory=list)
    ideal_customers: list[str] = Field(default_factory=list)
    bad_fit_customers: list[str] = Field(default_factory=list)
    preferred_tone: Optional[str] = None
    languages: list[str] = Field(default_factory=list)


class Mission(CamelModel):
    mission_id: str
    title: Optional[str] = None
    goal_type: GoalType
    description: str
    target_location: Optional[str] = None
    target_industry: Optional[str] = None
    target_business_size: Optional[str] = None
    desired_lead_count: Optional[int] = None
    urgency: Optional[Literal["low", "medium", "high"]] = None
    language: Optional[str] = None


class SearchOptions(CamelModel):
    max_queries: int = 6
    max_results_per_query: int = 8
    max_pages_to_fetch: int = 12
    include_sources: list[SourceKind] = Field(
        default_factory=lambda: ["web", "directories"]
    )
    user_provided_urls: list[str] = Field(default_factory=list)
    freshness_days: Optional[int] = None
    allow_llm: bool = False
    dry_run: bool = False


class ProviderOptions(CamelModel):
    provider: ProviderName = "mock"


class SearchAgentInput(CamelModel):
    request_id: str
    user_id: Optional[str] = None
    business_profile: BusinessProfile
    mission: Mission
    search_options: SearchOptions = Field(default_factory=SearchOptions)
    provider_options: ProviderOptions = Field(default_factory=ProviderOptions)


# ---------------------------------------------------------------------------
# Output contract
# ---------------------------------------------------------------------------

EvidenceType = Literal[
    "industry_match",
    "location_match",
    "service_match",
    "contact_found",
    "activity_signal",
    "bad_fit_signal",
    "other",
]

Category = Literal[
    "high_fit",
    "promising_but_incomplete",
    "needs_verification",
    "rejected_or_low_fit",
]

NextAction = Literal[
    "open_details",
    "investigate_more",
    "draft_outreach",
    "find_contact",
    "reject",
    "save_for_later",
]


class SearchPlan(CamelModel):
    interpreted_goal: str
    target_personas: list[str] = Field(default_factory=list)
    target_segments: list[str] = Field(default_factory=list)
    good_fit_signals: list[str] = Field(default_factory=list)
    bad_fit_signals: list[str] = Field(default_factory=list)
    suggested_sources: list[str] = Field(default_factory=list)
    generated_queries: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)


class EmailContact(CamelModel):
    value: str
    type: Literal["generic", "personal", "unknown"] = "unknown"
    confidence: float = 0.5
    source_url: Optional[str] = None


class PhoneContact(CamelModel):
    value: str
    confidence: float = 0.5
    source_url: Optional[str] = None


class SocialLink(CamelModel):
    platform: Literal["linkedin", "facebook", "instagram", "x", "other"]
    url: str


class ContactInfo(CamelModel):
    emails: list[EmailContact] = Field(default_factory=list)
    phones: list[PhoneContact] = Field(default_factory=list)
    contact_page_url: Optional[str] = None
    social_links: list[SocialLink] = Field(default_factory=list)


class Evidence(CamelModel):
    source_url: str
    title: Optional[str] = None
    snippet: str
    evidence_type: EvidenceType
    confidence: float = 0.5


class Scores(CamelModel):
    fit_score: float = 0
    contactability_score: float = 0
    evidence_quality_score: float = 0
    freshness_score: Optional[float] = None
    overall_score: float = 0


class Classification(CamelModel):
    category: Category
    confidence: Literal["low", "medium", "high"] = "medium"
    reasons: list[str] = Field(default_factory=list)
    missing_info: list[str] = Field(default_factory=list)
    recommended_next_action: NextAction = "open_details"


class CandidateLead(CamelModel):
    id: str
    mission_id: str
    name: str
    type: Literal["company", "person", "unknown"] = "company"
    website_url: Optional[str] = None
    domain: Optional[str] = None
    source_urls: list[str] = Field(default_factory=list)
    source_provider: Optional[str] = None
    source_query: Optional[str] = None

    short_description: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    business_size_estimate: Optional[str] = None

    contact: ContactInfo = Field(default_factory=ContactInfo)
    evidence: list[Evidence] = Field(default_factory=list)
    scores: Scores = Field(default_factory=Scores)
    classification: Classification = Field(
        default_factory=lambda: Classification(category="needs_verification")
    )

    created_at: str
    updated_at: str


class Groups(CamelModel):
    high_fit: list[str] = Field(default_factory=list)
    promising_but_incomplete: list[str] = Field(default_factory=list)
    needs_verification: list[str] = Field(default_factory=list)
    rejected_or_low_fit: list[str] = Field(default_factory=list)


class Summary(CamelModel):
    queries_run: int = 0
    raw_results_found: int = 0
    pages_fetched: int = 0
    candidates_created: int = 0
    duplicates_removed: int = 0
    high_fit_count: int = 0
    warning_count: int = 0


class SearchWarning(CamelModel):
    code: str
    message: str
    severity: Literal["info", "warning", "error"] = "warning"
    related_lead_id: Optional[str] = None


class SearchTraceEvent(CamelModel):
    timestamp: str
    step: str
    message: str
    metadata: Optional[dict] = None


class SearchAgentOutput(CamelModel):
    request_id: str
    mission_id: str
    status: Literal["success", "partial_success", "failed"]
    search_plan: SearchPlan
    candidates: list[CandidateLead] = Field(default_factory=list)
    groups: Groups = Field(default_factory=Groups)
    summary: Summary = Field(default_factory=Summary)
    warnings: list[SearchWarning] = Field(default_factory=list)
    trace: list[SearchTraceEvent] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# View model for the future Discover page
# ---------------------------------------------------------------------------


class DiscoverLeadCardVM(CamelModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    location: Optional[str] = None
    domain: Optional[str] = None
    contact_badges: list[str] = Field(default_factory=list)
    fit_score: float = 0
    category: str = "needs_verification"
    reasons: list[str] = Field(default_factory=list)
    missing_info: list[str] = Field(default_factory=list)
    recommended_next_action: str = "open_details"
    primary_action_label: str = "Open details"
