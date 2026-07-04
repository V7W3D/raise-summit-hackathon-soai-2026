from search_agent import run_search_agent, to_discover_card
from search_agent.fetching import MockPageFetcher
from search_agent.providers import MockSearchProvider

from .fixtures import example_input


def _top_candidate():
    output = run_search_agent(
        example_input(), provider=MockSearchProvider(), fetcher=MockPageFetcher()
    )
    return output.candidates[0]


def test_to_discover_card_maps_all_fields():
    candidate = _top_candidate()
    card = to_discover_card(candidate)

    assert card.id == candidate.id
    assert card.title == candidate.name
    assert card.domain == candidate.domain
    assert card.fit_score == candidate.scores.fit_score
    assert card.category == candidate.classification.category
    assert card.reasons == candidate.classification.reasons
    assert card.missing_info == candidate.classification.missing_info
    assert (
        card.recommended_next_action
        == candidate.classification.recommended_next_action
    )


def test_contact_badges_for_high_fit_lead():
    card = to_discover_card(_top_candidate())  # Rhône Plomberie
    assert "Email found" in card.contact_badges
    assert "Phone found" in card.contact_badges


def test_primary_action_label_is_human_readable():
    card = to_discover_card(_top_candidate())
    assert card.primary_action_label == "Draft outreach"


def test_card_serializes_camel_case():
    card = to_discover_card(_top_candidate())
    dumped = card.model_dump(by_alias=True)
    assert "contactBadges" in dumped
    assert "recommendedNextAction" in dumped
    assert "primaryActionLabel" in dumped
