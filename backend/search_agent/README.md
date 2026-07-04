# Search Agent

The first coded piece of ProspectPath: takes a business profile + prospecting
mission, plans searches, finds candidate companies, extracts contact data
deterministically, scores/classifies them, and returns evidence-backed leads
ready for the future Discover page.

LLM usage is limited to (optional) search planning. Extraction, dedupe,
scoring, counting, and classification are deterministic code.

## Usage

```python
from search_agent import run_search_agent, to_discover_card, SearchAgentInput

output = run_search_agent(SearchAgentInput.model_validate(payload))
cards = [to_discover_card(c) for c in output.candidates]
```

Or over HTTP: `POST /search-agent/run` with a `SearchAgentInput` JSON body
(camelCase, see `schemas.py`), returns a `SearchAgentOutput`.

The Discover page groups candidates with `output.groups.highFit`,
`promisingButIncomplete`, `needsVerification`, `rejectedOrLowFit` (lists of
candidate ids), and renders each candidate through `to_discover_card()`.

## Running

From `backend/`:

```bash
poetry run pytest tests/search_agent          # unit + integration tests
poetry run python scripts/run_search_agent_example.py   # demo (mock provider)
```

The example prints the plan, summary, and grouped candidates, and writes the
full JSON to `backend/tmp/search-agent-output.json`.

## Providers

The default provider is `mock` (canned Lyon construction leads, no network) —
keep it for demos. Real adapters activate when their env var is set and
`providerOptions.provider` selects them; a missing key falls back to mock
with a warning instead of failing:

| Provider | Env var          |
|----------|------------------|
| tavily   | `TAVILY_API_KEY` |
| exa      | `EXA_API_KEY`    |
| brave    | `BRAVE_API_KEY`  |
| serper   | `SERPER_API_KEY` |

Smoke-test a real provider: `SEARCH_PROVIDER=tavily poetry run python
scripts/run_search_agent_example.py` (bash) — the real adapters' request
shapes carry TODO-verify notes and were not exercised against live APIs.

Optional LLM planning uses `ANTHROPIC_API_KEY` + the `anthropic` package and
only runs when `searchOptions.allowLLM` is true; otherwise (or on any LLM
error) the deterministic fallback plan is used.

## Layout

- `schemas.py` — input/output contracts (Pydantic, camelCase JSON)
- `agent.py` — `run_search_agent` orchestration
- `planning/` — deterministic fallback plan + optional LLM plan
- `providers/` — search provider abstraction, mock + real adapters
- `fetching/` — page fetcher abstraction, HTTP + mock
- `extraction/` — URLs, emails, phones, socials, contact pages, HTML text
- `scoring/` — fit/contactability/evidence scores + classification
- `dedupe.py` — merge by domain / similar name
- `view_models/` — `to_discover_card` for the Discover page
- `mock_data.py` — demo fixtures (4 leads across the 4 categories)
