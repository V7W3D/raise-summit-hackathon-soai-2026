"""Example run of the Search Agent with a configured search provider.

Usage (from backend/):
    SEARCH_PROVIDER=tavily poetry run python scripts/run_search_agent_example.py

Requires SEARCH_PROVIDER and the matching API key in backend/.env.

Writes the full JSON output to tmp/search-agent-output.json.
"""

import json
import os
import sys
import uuid
from pathlib import Path

# Allow running as a plain script from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv  # noqa: E402

# Pick up provider API keys from backend/.env.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from search_agent import (  # noqa: E402
	BusinessProfile,
	Mission,
	ProviderOptions,
	SearchAgentInput,
	SearchOptions,
	run_search_agent,
	to_discover_card,
)
from search_agent.errors import ProviderNotConfiguredError  # noqa: E402


def build_example_input() -> SearchAgentInput:
	provider = os.environ.get("SEARCH_PROVIDER", "").strip()
	if not provider:
		raise ProviderNotConfiguredError(
			"SEARCH_PROVIDER is not set. Configure one of: tavily, exa, brave, serper"
		)

	return SearchAgentInput(
		request_id=str(uuid.uuid4()),
		business_profile=BusinessProfile(
			business_id="biz_callpilot",
			business_name="CallPilot AI",
			business_type="B2B SaaS",
			what_we_sell="AI phone receptionist for small service businesses",
			value_proposition=(
				"Answer missed calls 24/7, capture leads, summarize calls, "
				"and help business owners call back faster"
			),
			target_geographies=["France"],
			ideal_customers=["small local service companies that receive many calls"],
			bad_fit_customers=[
				"very large enterprises",
				"businesses with no phone-based workflow",
				"inactive companies",
			],
			languages=["fr", "en"],
		),
		mission=Mission(
			mission_id="mission_lyon_construction",
			title="Construction services in Lyon",
			description=(
				"Find small construction service businesses in Lyon likely to "
				"need AI call reception."
			),
			target_location="Lyon",
			target_industry="construction",
			language="fr",
		),
		search_options=SearchOptions(
			max_queries=6,
			max_results_per_query=8,
			max_pages_to_fetch=12,
			include_sources=["web", "directories"],
		),
		provider_options=ProviderOptions(provider=provider),  # type: ignore[arg-type]
	)


def main() -> None:
	output = run_search_agent(build_example_input())

	print(f"Status: {output.status}\n")
	print("Interpreted goal:")
	print(f"  {output.search_plan.interpreted_goal}\n")

	print("Generated queries:")
	for query in output.search_plan.generated_queries:
		print(f"  - {query}")

	print("\nSummary:")
	for key, value in output.summary.model_dump().items():
		print(f"  {key}: {value}")

	print("\nGroups:")
	groups = output.groups
	print(f"  high_fit: {len(groups.high_fit)}")
	print(f"  promising_but_incomplete: {len(groups.promising_but_incomplete)}")
	print(f"  needs_verification: {len(groups.needs_verification)}")
	print(f"  rejected_or_low_fit: {len(groups.rejected_or_low_fit)}")

	print("\nTop candidates:")
	for candidate in output.candidates[:5]:
		card = to_discover_card(candidate)
		print(f"\n  {card.title}  [{card.category}]  overall={candidate.scores.overall_score}")
		print(f"    domain: {card.domain}  fitScore: {card.fit_score}")
		print(f"    badges: {', '.join(card.contact_badges) or '(none)'}")
		print("    reasons:")
		for reason in card.reasons:
			print(f"      - {reason}")
		print("    missing info:")
		for missing in card.missing_info:
			print(f"      - {missing}")
		print(f"    next action: {card.recommended_next_action}")

	if output.warnings:
		print("\nWarnings:")
		for warning in output.warnings:
			print(f"  [{warning.severity}] {warning.code}: {warning.message}")

	out_path = Path(__file__).resolve().parents[1] / "tmp" / "search-agent-output.json"
	out_path.parent.mkdir(parents=True, exist_ok=True)
	out_path.write_text(
		json.dumps(output.model_dump(by_alias=True), indent=2, ensure_ascii=False),
		encoding="utf-8",
	)
	print(f"\nFull JSON written to {out_path}")


if __name__ == "__main__":
	main()
