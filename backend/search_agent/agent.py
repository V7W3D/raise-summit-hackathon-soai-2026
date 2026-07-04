"""Search Agent orchestrator.

runSearchAgent equivalent: plan -> search -> fetch -> extract -> dedupe ->
score -> classify -> group. LLM is used (optionally) only for planning;
everything else is deterministic code.
"""

from pydantic import ValidationError

from .dedupe import dedupe_candidates
from .extraction import (
    classify_email,
    extract_emails,
    extract_phones,
    extract_social_links,
    find_likely_contact_page_links,
    get_domain,
    normalize_url,
)
from .fetching import BasicHttpPageFetcher, MockPageFetcher, PageFetcher
from .planning import build_fallback_plan, build_llm_plan, llm_planning_available
from .providers import (
    ProviderSearchOptions,
    RawSearchResult,
    SearchProvider,
    create_provider,
)
from .schemas import (
    CandidateLead,
    ContactInfo,
    EmailContact,
    Evidence,
    Groups,
    PhoneContact,
    SearchAgentInput,
    SearchAgentOutput,
    SearchPlan,
    SearchWarning,
    SocialLink,
    Summary,
)
from .scoring import build_scoring_context, classify_candidate, score_candidate
from .scoring.score import ScoringContext
from .utils import TraceRecorder, new_id, normalize_text, now_iso

TITLE_SEPARATORS = (" - ", " – ", " | ", " • ")


def _company_name_from_title(title: str) -> str:
    name = title.strip()
    for separator in TITLE_SEPARATORS:
        if separator in name:
            name = name.split(separator, 1)[0].strip()
            break
    return name or title.strip()


def _build_candidate(
    result: RawSearchResult,
    agent_input: SearchAgentInput,
    provider_name: str,
    query: str,
    page,  # FetchedPage | None
    context: ScoringContext,
) -> CandidateLead:
    """Build a CandidateLead with deterministic extraction + evidence."""
    url = normalize_url(result.url)
    domain = get_domain(url)
    now = now_iso()

    page_html = page.html if page and page.ok else ""
    page_text = page.text if page and page.ok else ""
    combined_text = " ".join(filter(None, [result.snippet, page_text]))

    contact = ContactInfo()
    for email in extract_emails(page_html or combined_text):
        contact.emails.append(
            EmailContact(
                value=email,
                type=classify_email(email),
                confidence=0.9 if page_html else 0.6,
                source_url=url,
            )
        )
    for phone in extract_phones(combined_text):
        contact.phones.append(
            PhoneContact(value=phone, confidence=0.9 if page_text else 0.6, source_url=url)
        )
    if page_html:
        contact.social_links = [
            SocialLink(**link) for link in extract_social_links(page_html)
        ]
        contact_links = find_likely_contact_page_links(page_html, url)
        if contact_links:
            contact.contact_page_url = contact_links[0]

    candidate = CandidateLead(
        id=new_id("lead"),
        mission_id=agent_input.mission.mission_id,
        name=_company_name_from_title(
            (page.title if page and page.title else None) or result.title
        ),
        type="company",
        website_url=url,
        domain=domain,
        source_urls=[url],
        source_provider=provider_name,
        source_query=query,
        short_description=(result.snippet or (page_text[:200] if page_text else None)),
        contact=contact,
        created_at=now,
        updated_at=now,
    )

    # Evidence: same keyword sets the scorer uses, so scores are explainable.
    haystack = normalize_text(f"{candidate.name} {combined_text}")
    snippet = result.snippet or (page_text[:200] if page_text else candidate.name)

    def add_evidence(evidence_type: str, confidence: float) -> None:
        candidate.evidence.append(
            Evidence(
                source_url=url,
                title=result.title,
                snippet=snippet,
                evidence_type=evidence_type,
                confidence=confidence,
            )
        )

    if any(t in haystack for t in context.segment_terms if t):
        add_evidence("industry_match", 0.8)
        matched = next(t for t in context.segment_terms if t and t in haystack)
        candidate.industry = matched
    if any(t in haystack for t in context.location_terms if t):
        add_evidence("location_match", 0.8)
        candidate.location = agent_input.mission.target_location
    if contact.emails or contact.phones:
        add_evidence("contact_found", 0.9)
    if any(t in haystack for t in context.good_signal_terms):
        add_evidence("activity_signal", 0.7)
    if any(t in haystack for t in context.bad_signal_terms):
        add_evidence("bad_fit_signal", 0.8)
    if not candidate.evidence:
        add_evidence("other", 0.3)

    return candidate


def run_search_agent(
    agent_input: SearchAgentInput | dict,
    provider: SearchProvider | None = None,
    fetcher: PageFetcher | None = None,
) -> SearchAgentOutput:
    """Run the full search agent pipeline.

    `provider` and `fetcher` are injectable for tests; by default they are
    resolved from providerOptions (mock provider pairs with the mock fetcher
    so demos never hit the network).
    """
    trace = TraceRecorder()
    warnings: list[SearchWarning] = []

    # 1. Validate input -----------------------------------------------------
    try:
        if isinstance(agent_input, dict):
            agent_input = SearchAgentInput.model_validate(agent_input)
    except ValidationError as exc:
        return SearchAgentOutput(
            request_id=str(agent_input.get("requestId") or agent_input.get("request_id") or ""),
            mission_id="",
            status="failed",
            search_plan=SearchPlan(interpreted_goal="Input validation failed"),
            warnings=[
                SearchWarning(
                    code="invalid_input", message=str(exc), severity="error"
                )
            ],
        )

    options = agent_input.search_options
    mission = agent_input.mission
    trace.add("input", "Input received and validated", {"missionId": mission.mission_id})

    try:
        # 2. Search plan (LLM only if explicitly allowed and available) -----
        plan: SearchPlan
        if options.allow_llm and llm_planning_available():
            try:
                plan = build_llm_plan(agent_input)
                trace.add("plan", "Search plan generated by LLM")
            except Exception as exc:
                warnings.append(
                    SearchWarning(
                        code="llm_plan_failed",
                        message=f"LLM planning failed ({exc}); using deterministic plan.",
                    )
                )
                plan = build_fallback_plan(agent_input)
                trace.add("plan", "Fell back to deterministic search plan")
        else:
            plan = build_fallback_plan(agent_input)
            trace.add(
                "plan",
                "Search plan generated deterministically",
                {"queries": len(plan.generated_queries)},
            )

        if mission.goal_type == "find_hires":
            warnings.append(
                SearchWarning(
                    code="hiring_limited_support",
                    message=(
                        "Hiring is a special workflow: only public company/"
                        "professional pages are searched, never job platforms "
                        "or candidate profiles."
                    ),
                    severity="info",
                )
            )

        context = build_scoring_context(mission, plan)

        if options.dry_run:
            trace.add("dry_run", "Dry run requested; skipping search execution")
            return SearchAgentOutput(
                request_id=agent_input.request_id,
                mission_id=mission.mission_id,
                status="success",
                search_plan=plan,
                summary=Summary(warning_count=len(warnings)),
                warnings=warnings,
                trace=trace.events,
            )

        # 3. Resolve provider + fetcher --------------------------------------
        provider_name = agent_input.provider_options.provider
        if provider is None:
            provider, provider_warnings = create_provider(provider_name)
            warnings.extend(provider_warnings)
        if fetcher is None:
            fetcher = (
                MockPageFetcher() if provider.name == "mock" else BasicHttpPageFetcher()
            )
        trace.add("provider", f"Using search provider '{provider.name}'")

        # 4. Run queries -----------------------------------------------------
        search_options = ProviderSearchOptions(
            max_results=options.max_results_per_query,
            location=mission.target_location,
            language=mission.language,
        )
        raw_results: list[tuple[RawSearchResult, str]] = []
        queries_run = 0
        query_failures = 0
        for query in plan.generated_queries:
            try:
                results = provider.search(query, search_options)
                queries_run += 1
                raw_results.extend((r, query) for r in results)
                trace.add("search", f"Query returned {len(results)} results", {"query": query})
            except Exception as exc:
                query_failures += 1
                warnings.append(
                    SearchWarning(
                        code="query_failed",
                        message=f"Query '{query}' failed: {exc}",
                    )
                )

        # User-provided URLs become raw results too.
        if "user_urls" in options.include_sources or options.user_provided_urls:
            for user_url in options.user_provided_urls:
                raw_results.append(
                    (
                        RawSearchResult(
                            title=get_domain(user_url) or user_url,
                            url=user_url,
                            source="user_urls",
                        ),
                        "user_provided",
                    )
                )

        # 5. Fetch pages + build candidates -----------------------------------
        pages_fetched = 0
        fetch_failures = 0
        candidates: list[CandidateLead] = []
        fetched_pages: dict[str, object] = {}  # normalized url -> FetchedPage
        for result, query in raw_results:
            page = None
            page_url = normalize_url(result.url)
            if page_url in fetched_pages:
                page = fetched_pages[page_url]
            elif pages_fetched < options.max_pages_to_fetch:
                try:
                    page = fetcher.fetch_page(page_url)
                    fetched_pages[page_url] = page
                    if page.ok:
                        pages_fetched += 1
                    else:
                        fetch_failures += 1
                        warnings.append(
                            SearchWarning(
                                code="page_fetch_failed",
                                message=f"Could not fetch {result.url}: {page.error}",
                                severity="info",
                            )
                        )
                except Exception as exc:
                    fetch_failures += 1
                    warnings.append(
                        SearchWarning(
                            code="page_fetch_failed",
                            message=f"Could not fetch {result.url}: {exc}",
                            severity="info",
                        )
                    )
            try:
                candidates.append(
                    _build_candidate(
                        result, agent_input, provider.name, query, page, context
                    )
                )
            except Exception as exc:
                warnings.append(
                    SearchWarning(
                        code="extraction_failed",
                        message=f"Extraction failed for {result.url}: {exc}",
                    )
                )
        trace.add(
            "extract",
            f"Built {len(candidates)} candidates from {len(raw_results)} raw results",
            {"pagesFetched": pages_fetched},
        )

        # 6. Dedupe ------------------------------------------------------------
        candidates, duplicates_removed = dedupe_candidates(candidates)
        if duplicates_removed:
            trace.add("dedupe", f"Removed {duplicates_removed} duplicate candidates")

        # 7. Score + classify --------------------------------------------------
        groups = Groups()
        for candidate in candidates:
            page = fetched_pages.get(candidate.website_url or "")
            website_ok = bool(page is not None and page.ok)
            page_text = page.text if website_ok else None
            scoring = score_candidate(candidate, context, page_text, website_ok)
            candidate.scores = scoring.scores
            candidate.classification = classify_candidate(candidate, scoring, mission)
            candidate.updated_at = now_iso()

        # 8. Sort + group ----------------------------------------------------
        candidates.sort(key=lambda c: c.scores.overall_score, reverse=True)
        if mission.desired_lead_count:
            candidates = candidates[: max(mission.desired_lead_count, 1)]
        for candidate in candidates:
            bucket = {
                "high_fit": groups.high_fit,
                "promising_but_incomplete": groups.promising_but_incomplete,
                "needs_verification": groups.needs_verification,
                "rejected_or_low_fit": groups.rejected_or_low_fit,
            }[candidate.classification.category]
            bucket.append(candidate.id)

        trace.add(
            "classify",
            "Candidates scored and grouped",
            {
                "highFit": len(groups.high_fit),
                "promising": len(groups.promising_but_incomplete),
                "needsVerification": len(groups.needs_verification),
                "rejected": len(groups.rejected_or_low_fit),
            },
        )

        # 9. Status + summary --------------------------------------------------
        if queries_run == 0 and plan.generated_queries:
            status = "failed"
        elif query_failures or fetch_failures:
            status = "partial_success" if candidates else "failed"
        else:
            status = "success"

        summary = Summary(
            queries_run=queries_run,
            raw_results_found=len(raw_results),
            pages_fetched=pages_fetched,
            candidates_created=len(candidates),
            duplicates_removed=duplicates_removed,
            high_fit_count=len(groups.high_fit),
            warning_count=len(warnings),
        )

        return SearchAgentOutput(
            request_id=agent_input.request_id,
            mission_id=mission.mission_id,
            status=status,
            search_plan=plan,
            candidates=candidates,
            groups=groups,
            summary=summary,
            warnings=warnings,
            trace=trace.events,
        )

    except Exception as exc:  # catastrophic failure only
        warnings.append(
            SearchWarning(code="internal_error", message=str(exc), severity="error")
        )
        trace.add("error", f"Catastrophic failure: {exc}")
        return SearchAgentOutput(
            request_id=agent_input.request_id,
            mission_id=mission.mission_id,
            status="failed",
            search_plan=SearchPlan(interpreted_goal=mission.description),
            summary=Summary(warning_count=len(warnings)),
            warnings=warnings,
            trace=trace.events,
        )
