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
SEARCH_PROVIDER=tavily poetry run python scripts/run_search_agent_example.py
```

The example prints the plan, summary, and grouped candidates, and writes the
full JSON to `backend/tmp/search-agent-output.json`.

## Providers

A configured search provider is required. Set `SEARCH_PROVIDER` and the matching
API key in `backend/.env`. Missing configuration raises `ProviderNotConfiguredError`.

| Provider | Env var          |
|----------|------------------|
| tavily   | `TAVILY_API_KEY` |
| exa      | `EXA_API_KEY`    |
| brave    | `BRAVE_API_KEY`  |
| serper   | `SERPER_API_KEY` |

Mission create (`POST /missions`) reads `SEARCH_PROVIDER` from the environment
when no explicit provider is passed.

Optional LLM planning uses `GROQ_API_KEY` (same as mission assist / outreach) and
runs when `searchOptions.allowLLM` is true. Mission searches from the UI enable
LLM planning automatically when `GROQ_API_KEY` is set; otherwise (or on any LLM
error) the deterministic fallback plan is used.

## Layout

- `schemas.py` — input/output contracts (Pydantic, camelCase JSON)
- `agent.py` — `run_search_agent` orchestration
- `planning/` — deterministic fallback plan + optional LLM plan
- `providers/` — search provider abstraction + real adapters
- `fetching/` — page fetcher abstraction (HTTP)
- `extraction/` — URLs, emails, phones, socials, contact pages, HTML text
- `scoring/` — fit/contactability/evidence scores + classification
- `dedupe.py` — merge by domain / similar name
- `view_models/` — `to_discover_card` for the Discover page

Test-only fakes live under `tests/search_agent/support/`.
