import type { RawSearchResult, SearchProvider } from "./SearchProvider";

export const MOCK_SEARCH_RESULTS: RawSearchResult[] = [
  {
    title: "Rhône Plomberie - Plombier Lyon",
    url: "https://rhoneplomberie.fr",
    snippet:
      "Plombier à Lyon. Intervention rapide 24h/24 et 7j/7 pour tous vos dépannages de plomberie.",
    source: "mock",
  },
  {
    title: "BTP Rhône Services - Rénovation Lyon",
    url: "https://btprhone.fr",
    snippet:
      "Entreprise de rénovation et maintenance à Lyon. Travaux de bâtiment pour particuliers et professionnels.",
    source: "mock",
  },
  {
    title: "EcoBuild Lyon - Construction durable",
    url: "https://ecobuild-lyon.fr",
    snippet:
      "Construction durable et rénovation écologique en région Auvergne-Rhône-Alpes. Blog actif.",
    source: "mock",
  },
  {
    title: "Paris Enterprise Construction Group",
    url: "https://bigconstructiongroup.example",
    snippet:
      "Grand groupe national de construction, projets publics, appels d'offres grands comptes.",
    source: "mock",
  },
];

export const MOCK_PAGE_CONTENT: Record<string, string> = {
  "https://rhoneplomberie.fr":
    "<html><head><title>Rhône Plomberie</title></head><body>Plombier à Lyon. Intervention rapide 24h/24 et 7j/7 pour tous vos dépannages de plomberie. Contactez-nous au 04 78 123 456. Devis gratuit. contact@rhoneplomberie.fr</body></html>",
  "https://btprhone.fr":
    "<html><head><title>BTP Rhône Services</title></head><body>Entreprise de rénovation et maintenance à Lyon. Travaux de bâtiment pour particuliers et professionnels. Contact via formulaire. <a href='/contact'>Contactez-nous</a></body></html>",
  "https://ecobuild-lyon.fr":
    "<html><head><title>EcoBuild Lyon</title></head><body>Construction durable et rénovation écologique en région Auvergne-Rhône-Alpes. Blog actif. Pas de téléphone visible.</body></html>",
  "https://bigconstructiongroup.example":
    "<html><head><title>Paris Enterprise Construction Group</title></head><body>Grand groupe national de construction, projets publics, appels d'offres grands comptes. Siège Paris.</body></html>",
};

export class MockSearchProvider implements SearchProvider {
  name = "mock";

  async search(query: string): Promise<RawSearchResult[]> {
    const q = query.toLowerCase();
    return MOCK_SEARCH_RESULTS.filter((result) => {
      const haystack = `${result.title} ${result.snippet ?? ""} ${result.url}`.toLowerCase();
      const tokens = q.split(/\s+/).filter((t) => t.length > 2);
      if (tokens.length === 0) return true;
      return tokens.some((token) => haystack.includes(token));
    }).length > 0
      ? MOCK_SEARCH_RESULTS
      : MOCK_SEARCH_RESULTS.slice(0, 2);
  }
}
