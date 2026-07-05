import { describe, it, expect } from "vitest";
import { toDiscoverCard } from "../../src/search-agent/view-models/toDiscoverCard";
import type { CandidateLead } from "../../src/search-agent/schemas";

describe("toDiscoverCard", () => {
  it("maps candidate fields to discover card VM", () => {
    const candidate: CandidateLead = {
      id: "lead_1",
      missionId: "m1",
      name: "Rhône Plomberie",
      type: "company",
      domain: "rhoneplomberie.fr",
      sourceUrls: ["https://rhoneplomberie.fr"],
      shortDescription: "Local emergency plumbing",
      location: "Lyon, France",
      contact: {
        emails: [{ value: "contact@rhoneplomberie.fr", type: "generic", confidence: 0.8 }],
        phones: [{ value: "04 78 123 456", confidence: 0.85 }],
      },
      evidence: [],
      scores: {
        fitScore: 85,
        contactabilityScore: 80,
        evidenceQualityScore: 75,
        overallScore: 84,
      },
      classification: {
        category: "high_fit",
        confidence: "high",
        reasons: ["Local plumbing company in Lyon"],
        missingInfo: ["No named decision-maker found"],
        recommendedNextAction: "draft_outreach",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const card = toDiscoverCard(candidate);
    expect(card.title).toBe("Rhône Plomberie");
    expect(card.contactBadges).toContain("Email found");
    expect(card.contactBadges).toContain("Phone found");
    expect(card.fitScore).toBe(84);
    expect(card.primaryActionLabel).toBe("Draft outreach");
  });
});
