"""Mock search results and web pages for demos and tests.

Four leads covering the classification spectrum for the example mission
"Find small construction service businesses in Lyon likely to need AI call
reception":

- Rhône Plomberie          -> high_fit (local, emergency, phone + email)
- BTP Rhône Services       -> promising (good fit, contact form only)
- EcoBuild Lyon            -> promising/needs_verification (no contact info)
- Paris Enterprise Group   -> rejected_or_low_fit (large national group)
"""

from .providers.base import RawSearchResult

MOCK_SEARCH_RESULTS: list[RawSearchResult] = [
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
    RawSearchResult(
        title="Paris Enterprise Construction Group - Grands projets nationaux",
        url="https://bigconstructiongroup.example",
        snippet=(
            "Grand groupe national de construction, projets publics, appels "
            "d'offres grands comptes."
        ),
        source="web",
    ),
]

MOCK_PAGES: dict[str, str] = {
    "https://rhoneplomberie.fr": """
<html><head><title>Rhône Plomberie - Plombier à Lyon</title></head>
<body>
<h1>Rhône Plomberie</h1>
<p>Plombier à Lyon. Intervention rapide 24h/24 et 7j/7 pour tous vos dépannages
de plomberie. Contactez-nous au 04 78 12 34 56. Devis gratuit.
Écrivez-nous à contact@rhoneplomberie.fr</p>
<a href="/contact">Contactez-nous</a>
<a href="https://www.facebook.com/rhoneplomberie">Facebook</a>
</body></html>
""",
    "https://btprhone.fr": """
<html><head><title>BTP Rhône Services - Rénovation et maintenance à Lyon</title></head>
<body>
<h1>BTP Rhône Services</h1>
<p>Entreprise de rénovation et maintenance à Lyon. Travaux de bâtiment pour
particuliers et professionnels. Contact via formulaire.</p>
<a href="/nous-contacter">Nous contacter</a>
</body></html>
""",
    "https://ecobuild-lyon.fr": """
<html><head><title>EcoBuild Lyon - Construction durable</title></head>
<body>
<h1>EcoBuild Lyon</h1>
<p>Construction durable et rénovation écologique en région
Auvergne-Rhône-Alpes. Blog actif. Pas de téléphone visible.</p>
<a href="/blog">Notre blog</a>
</body></html>
""",
    "https://bigconstructiongroup.example": """
<html><head><title>Paris Enterprise Construction Group</title></head>
<body>
<h1>Paris Enterprise Construction Group</h1>
<p>Grand groupe national de construction, projets publics, appels d'offres
grands comptes.</p>
</body></html>
""",
}
