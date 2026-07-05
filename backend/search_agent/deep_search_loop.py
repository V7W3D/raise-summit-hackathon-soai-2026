"""Evolutive deep search: plan → search → extract → evaluate → refine → repeat."""

from __future__ import annotations

from typing import Callable

from .extraction import get_domain, normalize_url
from .planning.llm import (
	build_deep_refinement_queries,
	build_llm_plan,
	evaluate_search_round,
	llm_planning_available,
)
from .planning import build_fallback_plan
from .providers import ProviderSearchOptions, RawSearchResult, SearchProvider
from .schemas import SearchAgentInput, SearchPlan, SearchWarning
from .scoring.score import ScoringContext

ProgressCallback = Callable[[dict], None]


class DeepSearchState:
	def __init__(self) -> None:
		self.raw_results: list[tuple[RawSearchResult, str]] = []
		self.queries_executed: list[str] = []
		self.seen_urls: set[str] = set()
		self.queries_run = 0
		self.query_failures = 0
		self.round_learnings: list[str] = []


def run_evolutive_deep_search(
	*,
	agent_input: SearchAgentInput,
	provider: SearchProvider,
	fetcher,
	context: ScoringContext,
	plan: SearchPlan,
	build_candidate_fn,
	report: ProgressCallback,
	trace,
	warnings: list[SearchWarning],
) -> tuple[list, dict[str, object], int, int]:
	"""Iterative search loop. Returns (candidates, fetched_pages, pages_fetched, emails_found)."""
	options = agent_input.search_options
	mission = agent_input.mission
	state = DeepSearchState()

	search_opts = ProviderSearchOptions(
		max_results=options.max_results_per_query,
		location=mission.target_location,
		language=mission.language,
	)

	max_rounds = options.max_rounds
	queries_per_round = options.queries_per_round
	pages_budget = options.max_pages_to_fetch

	pending_queries = list(plan.generated_queries)

	for round_num in range(1, max_rounds + 1):
		report(
			phase="searching",
			deep_round=round_num,
			deep_rounds_total=max_rounds,
			search_mode=options.search_mode,
		)
		trace.add(
			"deep_round",
			f"Deep search round {round_num}/{max_rounds}",
			{"round": round_num},
		)

		# Pick queries for this round
		round_queries: list[str] = []
		while pending_queries and len(round_queries) < queries_per_round:
			q = pending_queries.pop(0)
			if q and q not in state.queries_executed:
				round_queries.append(q)

		if not round_queries and round_num > 1:
			break
		if not round_queries and round_num == 1:
			# Seed from plan if empty
			if options.allow_llm and llm_planning_available():
				try:
					fresh = build_llm_plan(agent_input)
					round_queries = fresh.generated_queries[:queries_per_round]
				except Exception:
					fallback = build_fallback_plan(agent_input)
					round_queries = fallback.generated_queries[:queries_per_round]
			else:
				fallback = build_fallback_plan(agent_input)
				round_queries = fallback.generated_queries[:queries_per_round]

		# --- SEARCH ---
		round_titles: list[str] = []
		for query in round_queries:
			if query in state.queries_executed:
				continue
			try:
				results = provider.search(query, search_opts)
				state.queries_run += 1
				state.queries_executed.append(query)
				for result in results:
					url_key = normalize_url(result.url)
					if url_key in state.seen_urls:
						continue
					state.seen_urls.add(url_key)
					state.raw_results.append((result, query))
					if result.title:
						round_titles.append(result.title)
				report(
					queries_run=state.queries_run,
					results_found=len(state.raw_results),
					queries_planned=len(state.queries_executed) + len(pending_queries),
				)
				trace.add("search", f"Round {round_num}: {len(results)} results", {"query": query})
			except Exception as exc:
				state.query_failures += 1
				warnings.append(
					SearchWarning(
						code="query_failed",
						message=f"Query '{query}' failed: {exc}",
					)
				)

		if round_num >= max_rounds:
			break

		# --- EVALUATE round (LLM learns from results) ---
		report(phase="evaluating", deep_round=round_num, search_mode=options.search_mode)
		evaluation = evaluate_search_round(
			agent_input,
			round_num=round_num,
			queries_run=state.queries_executed,
			result_titles=round_titles or [t for r, _ in state.raw_results[-15:] if (t := r.title)],
			total_results=len(state.raw_results),
		)

		learning = evaluation.get("learnings") or evaluation.get("learning") or ""
		if learning:
			state.round_learnings.append(str(learning))
			plan.assumptions.append(f"Round {round_num}: {learning}")

		suggested = evaluation.get("suggestedQueries") or evaluation.get("suggested_queries") or []
		new_queries = [str(q).strip() for q in suggested if str(q).strip()]

		if not new_queries and options.allow_llm and llm_planning_available():
			report(phase="refining", deep_round=round_num, search_mode=options.search_mode)
			new_queries = build_deep_refinement_queries(
				agent_input,
				initial_plan=plan,
				queries_already_run=state.queries_executed,
				discovery_titles=round_titles,
				max_new_queries=queries_per_round,
				round_learnings=state.round_learnings,
			)

		for q in new_queries:
			if q not in state.queries_executed and q not in pending_queries:
				pending_queries.append(q)

		trace.add(
			"evaluate",
			f"Round {round_num} evaluation",
			{"newQueries": len(new_queries), "pending": len(pending_queries)},
		)

		if not new_queries and not pending_queries:
			trace.add("deep_round", f"Stopping early after round {round_num} — no new queries")
			break

	plan.generated_queries = list(state.queries_executed)

	# --- EXTRACT all accumulated results ---
	report(phase="extracting", search_mode=options.search_mode)
	candidates = []
	fetched_pages: dict[str, object] = {}
	pages_fetched = 0
	emails_found = 0
	phones_found = 0
	fetch_failures = 0

	for result, query in state.raw_results:
		page = None
		page_url = normalize_url(result.url)
		if page_url in fetched_pages:
			page = fetched_pages[page_url]
		elif pages_fetched < pages_budget:
			try:
				page = fetcher.fetch_page(page_url)
				fetched_pages[page_url] = page
				if page.ok:
					pages_fetched += 1
				else:
					fetch_failures += 1
			except Exception:
				fetch_failures += 1
		try:
			candidate = build_candidate_fn(result, query, page, context)
			candidates.append(candidate)
			emails_found += len(candidate.contact.emails)
			phones_found += len(candidate.contact.phones)
		except Exception as exc:
			warnings.append(
				SearchWarning(
					code="extraction_failed",
					message=f"Extraction failed for {result.url}: {exc}",
				)
			)
		report(
			pages_fetched=pages_fetched,
			emails_found=emails_found,
			phones_found=phones_found,
			candidates_built=len(candidates),
		)

	trace.add(
		"extract",
		f"Deep search built {len(candidates)} candidates over {max_rounds} rounds",
		{"pagesFetched": pages_fetched, "queriesRun": state.queries_run},
	)

	return candidates, fetched_pages, pages_fetched, emails_found
