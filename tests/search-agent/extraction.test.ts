import { describe, it, expect } from "vitest";
import { normalizeUrl, getDomain } from "../../src/search-agent/extraction/url";
import { extractEmails, classifyEmail } from "../../src/search-agent/extraction/email";
import { extractPhones } from "../../src/search-agent/extraction/phone";
import { findLikelyContactPageLinks } from "../../src/search-agent/extraction/contactPage";

describe("URL utilities", () => {
  it("normalizes URLs", () => {
    expect(normalizeUrl("HTTPS://Example.com/Page/")).toBe(
      "https://example.com/page",
    );
  });

  it("extracts domain without www", () => {
    expect(getDomain("https://www.rhoneplomberie.fr/contact")).toBe(
      "rhoneplomberie.fr",
    );
  });
});

describe("email extraction", () => {
  it("extracts and classifies emails", () => {
    const text =
      "Contact contact@rhoneplomberie.fr or jean.dupont@rhoneplomberie.fr";
    const emails = extractEmails(text);
    expect(emails).toContain("contact@rhoneplomberie.fr");
    expect(classifyEmail("contact@rhoneplomberie.fr")).toBe("generic");
    expect(classifyEmail("jean.dupont@rhoneplomberie.fr")).toBe("personal");
  });
});

describe("phone extraction", () => {
  it("extracts French phone numbers", () => {
    const phones = extractPhones("Contactez-nous au 04 78 123 456");
    expect(phones.length).toBeGreaterThan(0);
    expect(phones[0]).toMatch(/04/);
  });
});

describe("contact page detection", () => {
  it("finds contact links in HTML", () => {
    const html =
      '<a href="/nous-contacter">Contactez-nous</a><a href="/about">About</a>';
    const links = findLikelyContactPageLinks(html, "https://example.fr");
    expect(links.some((l) => l.includes("nous-contacter"))).toBe(true);
  });
});
