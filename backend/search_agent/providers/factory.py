"""Provider selection: instantiate the requested search provider or raise."""

import os

from ..errors import ProviderNotConfiguredError
from .base import SearchProvider

ENV_KEYS = {
	"tavily": "TAVILY_API_KEY",
	"exa": "EXA_API_KEY",
	"brave": "BRAVE_API_KEY",
	"serper": "SERPER_API_KEY",
}

SUPPORTED_PROVIDERS = frozenset({*ENV_KEYS.keys(), "fixture"})


def create_provider(name: str) -> SearchProvider:
	"""Return a configured search provider or raise ProviderNotConfiguredError."""
	if not name:
		raise ProviderNotConfiguredError("Search provider name is required")

	if name == "custom":
		raise ProviderNotConfiguredError(
			"Custom search provider is not configured for this deployment"
		)

	if name == "fixture":
		from .fixture import FixtureSearchProvider

		return FixtureSearchProvider()

	env_key = ENV_KEYS.get(name)
	if env_key is None:
		raise ProviderNotConfiguredError(
			f"Unknown search provider '{name}'. "
			f"Supported providers: {', '.join(sorted(SUPPORTED_PROVIDERS))}"
		)

	if not os.environ.get(env_key):
		raise ProviderNotConfiguredError(
			f"{env_key} is not set; cannot use the '{name}' search provider"
		)

	try:
		if name == "tavily":
			from .tavily import TavilySearchProvider

			return TavilySearchProvider()
		if name == "exa":
			from .exa import ExaSearchProvider

			return ExaSearchProvider()
		if name == "brave":
			from .brave import BraveSearchProvider

			return BraveSearchProvider()
		if name == "serper":
			from .serper import SerperSearchProvider

			return SerperSearchProvider()
	except ValueError as exc:
		raise ProviderNotConfiguredError(str(exc)) from exc
	except Exception as exc:
		raise ProviderNotConfiguredError(
			f"Provider '{name}' failed to initialize: {exc}"
		) from exc

	raise ProviderNotConfiguredError(
		f"Unknown search provider '{name}'. "
		f"Supported providers: {', '.join(sorted(SUPPORTED_PROVIDERS))}"
	)
