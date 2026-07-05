import { describe, it, expect } from "vitest";
import { scoreCandidate } from "../../src/search-agent/scoring/scoreCandidate";
import {
  classifyCandidate,
  findBadFitSignalsInText,
} from "../../src/search-agent/scoring/classifyCandidate";
import type { CandidateLead, SearchPlan } from "../../src/search-agent/schemas";

const plan: SearchPlan = {
  interpretedGoal: "Find small construction businesses in Lyon",
  targetPersonas: ["owner"],
  targetSegments: ["plumbers", "plombier", "construction", "renovation", "rénovation"],
  goodFitSignals: [
    "local service business",
    "phone-first workflow",
    "emergency service",
    "active website",
    "urgence",
    "24h",
  ],
  badFitSignals: [
    "large enterprise",
    "national group",
    "grand groupe",
    "grands comptes",
  ],
  suggestedSources: ["web"],
  generatedQueries: [],
  assumptions: [],
};

const understanding = {
  goalType: "find_clients",
  description: "Find construction in Lyon",
  targetLocation: "Lyon",
  targetIndustry: "construction",
  language: "fr",
  isFrench: true,
  businessContext: "CallPilot AI",
};

function baseCandidate(overrides: Partial<CandidateLead> = {}): CandidateLead {
  const now = new Date().toISOString();
  return {
    id: "lead_test",
    missionId: "m1",
    name: "Test Lead",
    type: "company",
    sourceUrls: ["https://example.fr"],
    contact: { emails: [], phones: [] },
    evidence: [],
    scores: {
      fitScore: 0,
      contactabilityScore: 0,
      evidenceQualityScore: 0,
      overallScore: 0,
    },
    classification: {
      category: "needs_verification",
      confidence: "low",
      reasons: [],
      missingInfo: [],
      recommendedNextAction: "open_details",
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("scoreCandidate", () => {
  it("scores strong local plumbing lead high", () => {
    const candidate = baseCandidate({
      name: "Rhône Plomberie",
      location: "Lyon, France",
      shortDescription: "Plombier à Lyon urgence 24h/24",
      contact: {
        emails: [{ value: "contact@rhoneplomberie.fr", type: "generic", confidence: 0.8 }],
        phones: [{ value: "04 78 123 456", confidence: 0.85 }],
        contactPageUrl: "https://rhoneplomberie.fr/contact",
      },
      evidence: [
        {
          sourceUrl: "https://rhoneplomberie.fr",
          snippet: "Local plumbing Lyon emergency",
          evidenceType: "location_match",
          confidence: 0.8,
        },
        {
          sourceUrl: "https://rhoneplomberie.fr",
          snippet: "Contact found",
          evidenceType: "contact_found",
          confidence: 0.85,
        },
      ],
    });

    const scores = scoreCandidate(candidate, {
      plan,
      understanding,
      pageText:
        "Plombier à Lyon. Intervention rapide 24h/24. Contactez-nous au 04 78 123 456. contact@rhoneplomberie.fr",
      websiteOk: true,
    });

    expect(scores.overallScore).toBeGreaterThanOrEqual(75);
    expect(scores.fitScore).toBeGreaterThanOrEqual(70);
  });

  it("scores irrelevant enterprise lead low", () => {
    const candidate = baseCandidate({
      name: "Paris Enterprise Construction Group",
      location: "Paris, France",
      shortDescription: "Grand groupe national grands comptes",
      evidence: [
        {
          sourceUrl: "https://bigconstructiongroup.example",
          snippet: "Grand groupe national projets publics grands comptes",
          evidenceType: "bad_fit_signal",
          confidence: 0.8,
        },
      ],
    });

    const scores = scoreCandidate(candidate, {
      plan,
      understanding,
      pageText:
        "Grand groupe national de construction, projets publics, appels d'offres grands comptes.",
      websiteOk: true,
    });

    expect(scores.overallScore).toBeLessThan(45);
  });

  it("classifies good fit without contact as promising/incomplete", () => {
    const candidate = baseCandidate({
      name: "BTP Rhône Services",
      location: "Lyon",
      shortDescription: "Entreprise de rénovation à Lyon",
      contact: { emails: [], phones: [], contactPageUrl: "https://btprhone.fr/contact" },
      evidence: [
        {
          sourceUrl: "https://btprhone.fr",
          snippet: "Rénovation Lyon local service",
          evidenceType: "service_match",
          confidence: 0.7,
        },
      ],
    });

    const scores = scoreCandidate(candidate, {
      plan,
      understanding,
      pageText: "Entreprise de rénovation et maintenance à Lyon.",
      websiteOk: true,
    });

    const classification = classifyCandidate({ ...candidate, scores }, []);
    expect(classification.category).not.toBe("rejected_or_low_fit");
    expect(["promising_but_incomplete", "needs_verification", "high_fit"]).toContain(
      classification.category,
    );
  });
});

describe("classifyCandidate grouping", () => {
  it("places enterprise in rejected_or_low_fit", () => {
    const candidate = baseCandidate({
      contact: { emails: [], phones: [] },
      scores: {
        fitScore: 20,
        contactabilityScore: 0,
        evidenceQualityScore: 30,
        overallScore: 18,
      },
    });

    const badFit = findBadFitSignalsInText(
      "Grand groupe national grands comptes",
      plan.badFitSignals,
    );
    const classification = classifyCandidate(candidate, badFit);
    expect(classification.category).toBe("rejected_or_low_fit");
    expect(classification.recommendedNextAction).toBe("reject");
  });
});
