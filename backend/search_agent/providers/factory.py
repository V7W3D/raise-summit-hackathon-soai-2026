"""Provider selection: pick the requested provider, fall back to mock."""

import os

from ..schemas import SearchWarning
from .base import SearchProvider
from .mock import MockSearchProvider

ENV_KEYS = {
    "tavily": "TAVILY_API_KEY",
    "exa": "EXA_API_KEY",
    "brave": "BRAVE_API_KEY",
    "serper": "SERPER_API_KEY",
}


def create_provider(name: str) -> tuple[SearchProvider, list[SearchWarning]]:
    """Return (provider, warnings). Falls back to the mock provider when a
    real provider is requested but not configured, so the agent never dies
    on a missing API key."""
    warnings: list[SearchWarning] = []

    if name in ("mock", "custom"):
        if name == "custom":
            warnings.append(
                SearchWarning(
                    code="custom_provider_not_configured",
                    message="Custom provider requested; using mock provider instead.",
                    severity="info",
                )
            )
        return MockSearchProvider(), warnings

    env_key = ENV_KEYS.get(name)
    if env_key and not os.environ.get(env_key):
        warnings.append(
            SearchWarning(
                code="provider_key_missing",
                message=f"{env_key} is not set; falling back to mock provider.",
                severity="warning",
            )
        )
        return MockSearchProvider(), warnings

    try:
        if name == "tavily":
            from .tavily import TavilySearchProvider

            return TavilySearchProvider(), warnings
        if name == "exa":
            from .exa import ExaSearchProvider

            return ExaSearchProvider(), warnings
        if name == "brave":
            from .brave import BraveSearchProvider

            return BraveSearchProvider(), warnings
        if name == "serper":
            from .serper import SerperSearchProvider

            return SerperSearchProvider(), warnings
    except Exception as exc:  # provider construction must never kill the run
        warnings.append(
            SearchWarning(
                code="provider_init_failed",
                message=f"Provider '{name}' failed to initialize ({exc}); "
                "falling back to mock provider.",
                severity="warning",
            )
        )
        return MockSearchProvider(), warnings

    warnings.append(
        SearchWarning(
            code="unknown_provider",
            message=f"Unknown provider '{name}'; falling back to mock provider.",
            severity="warning",
        )
    )
    return MockSearchProvider(), warnings
