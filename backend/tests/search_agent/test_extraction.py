from search_agent.extraction import (
    classify_email,
    clean_text,
    extract_emails,
    extract_phones,
    extract_social_links,
    extract_title,
    find_likely_contact_page_links,
    get_domain,
    normalize_url,
)


# --- URL normalization ------------------------------------------------------

def test_normalize_url_adds_scheme_and_strips_fragment():
    assert normalize_url("rhoneplomberie.fr/") == "https://rhoneplomberie.fr"
    assert (
        normalize_url("HTTPS://WWW.Example.com/Page/#section")
        == "https://www.example.com/Page"
    )


def test_get_domain_strips_www_and_port():
    assert get_domain("https://www.rhoneplomberie.fr/contact") == "rhoneplomberie.fr"
    assert get_domain("http://example.com:8080/x") == "example.com"


# --- Emails -----------------------------------------------------------------

def test_extract_emails_finds_and_dedupes():
    text = (
        "Écrivez à contact@rhoneplomberie.fr ou contact@rhoneplomberie.fr, "
        "ou jean.dupont@rhoneplomberie.fr. Logo: logo@2x.png"
    )
    emails = extract_emails(text)
    assert emails == ["contact@rhoneplomberie.fr", "jean.dupont@rhoneplomberie.fr"]


def test_classify_email_generic_vs_personal():
    assert classify_email("info@acme.fr") == "generic"
    assert classify_email("contact@acme.fr") == "generic"
    assert classify_email("sales@acme.fr") == "generic"
    assert classify_email("jean.dupont@acme.fr") == "personal"
    assert classify_email("mdurand@acme.fr") == "personal"


# --- Phones -----------------------------------------------------------------

def test_extract_phones_french_formats():
    text = "Appelez le 04 78 12 34 56 ou le 06.11.22.33.44 ou +33 4 78 12 34 56"
    phones = extract_phones(text)
    assert "04 78 12 34 56" in phones
    assert "06 11 22 33 44" in phones
    assert any(p.startswith("+33") for p in phones)


def test_extract_phones_ignores_short_numbers():
    assert extract_phones("Prix: 04 78") == []


# --- HTML -------------------------------------------------------------------

def test_extract_title_and_clean_text():
    html = "<html><head><title> Rh&ocirc;ne  Plomberie </title></head><body><script>x()</script><p>Plombier &agrave; Lyon</p></body></html>"
    assert extract_title(html) == "Rhône Plomberie"
    text = clean_text(html)
    assert "Plombier à Lyon" in text
    assert "x()" not in text


# --- Social links -----------------------------------------------------------

def test_extract_social_links():
    html = (
        '<a href="https://www.facebook.com/rhoneplomberie">fb</a>'
        '<a href="https://www.linkedin.com/company/acme">in</a>'
    )
    links = extract_social_links(html)
    platforms = {link["platform"] for link in links}
    assert platforms == {"facebook", "linkedin"}


# --- Contact page detection ---------------------------------------------------

def test_find_likely_contact_page_links():
    html = (
        '<a href="/contact">Contactez-nous</a>'
        '<a href="/blog">Blog</a>'
        '<a href="https://other-domain.fr/contact">External</a>'
    )
    links = find_likely_contact_page_links(html, "https://rhoneplomberie.fr")
    assert links == ["https://rhoneplomberie.fr/contact"]


def test_contact_page_detected_from_anchor_text():
    html = '<a href="/page-42">Nous contacter</a>'
    links = find_likely_contact_page_links(html, "https://btprhone.fr")
    assert links == ["https://btprhone.fr/page-42"]
