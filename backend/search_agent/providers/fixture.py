"""Local dev search provider — returns canned results without external API keys."""

from search_agent.extraction.html import clean_text, extract_title
from search_agent.extraction.url import normalize_url
from search_agent.fetching.base import FetchedPage, PageFetcher
from search_agent.providers.base import ProviderSearchOptions, RawSearchResult, SearchProvider
from search_agent.utils import normalize_text

FIXTURE_SEARCH_RESULTS: list[RawSearchResult] = [
	RawSearchResult(
		title="Rhône Plomberie - Plombier à Lyon, dépannage 24h/24",
		url="https://rhoneplomberie.fr",
		snippet=(
			"Plombier à Lyon. Intervention rapide 24h/24 et 7j/7 pour tous vos "
			"dépannages de plomberie. Devis gratuit."
		),
		source="web",
	),
	RawSearchResult(
		title="BTP Rhône Services - Entreprise de rénovation à Lyon",
		url="https://btprhone.fr",
		snippet=(
			"Entreprise de rénovation et maintenance à Lyon. Travaux de bâtiment "
			"pour particuliers et professionnels."
		),
		source="web",
	),
	RawSearchResult(
		title="EcoBuild Lyon - Construction durable en Auvergne-Rhône-Alpes",
		url="https://ecobuild-lyon.fr",
		snippet=(
			"Construction durable et rénovation écologique en région "
			"Auvergne-Rhône-Alpes. Blog actif."
		),
		source="web",
	),
]

FIXTURE_PAGES: dict[str, str] = {
	"https://rhoneplomberie.fr": """
<html><head><title>Rhône Plomberie - Plombier à Lyon</title></head>
<body>
<h1>Rhône Plomberie</h1>
<p>Plombier à Lyon. Intervention rapide 24h/24 et 7j/7 pour tous vos dépannages
de plomberie. Contactez-nous au 04 78 12 34 56. Devis gratuit.
Intervention d'urgence pour fuites, débouchage, chauffe-eau.</p>
</body></html>
""",
	"https://btprhone.fr": """
<html><head><title>BTP Rhône Services</title></head>
<body>
<h1>BTP Rhône Services</h1>
<p>Entreprise de rénovation et maintenance à Lyon depuis 20 ans.
Appelez le 04 72 000 000. Équipe locale, dépannage et travaux.</p>
</body></html>
""",
	"https://ecobuild-lyon.fr": """
<html><head><title>EcoBuild Lyon</title></head>
<body>
<h1>EcoBuild Lyon</h1>
<p>Construction durable et rénovation écologique à Lyon.
Projets résidentiels et petits chantiers. Blog actif.</p>
</body></html>
""",
}


class FixtureSearchProvider(SearchProvider):
	name = "fixture"

	def __init__(self) -> None:
		self._returned: set[str] = set()

	def search(
		self, query: str, options: ProviderSearchOptions
	) -> list[RawSearchResult]:
		remaining = [r for r in FIXTURE_SEARCH_RESULTS if r.url not in self._returned]
		if not remaining:
			return []

		query_tokens = set(normalize_text(query).split())
		matching = [
			r
			for r in remaining
			if query_tokens
			& set(normalize_text(f"{r.title} {r.snippet or ''}").split())
		]
		chosen = (matching or remaining)[: max(1, options.max_results)]
		chosen = chosen[:2]
		self._returned.update(r.url for r in chosen)
		return chosen


class FixturePageFetcher(PageFetcher):
	def __init__(self) -> None:
		self._pages = {
			normalize_url(url): html for url, html in FIXTURE_PAGES.items()
		}

	def fetch_page(self, url: str) -> FetchedPage:
		html = self._pages.get(normalize_url(url))
		if html is None:
			return FetchedPage(url=url, status=404, ok=False, error="not_found")
		return FetchedPage(
			url=url,
			final_url=url,
			status=200,
			ok=True,
			title=extract_title(html),
			text=clean_text(html),
			html=html,
		)
