import { describe, it, expect } from "vitest";
import { dedupeCandidates } from "../../src/search-agent/dedupe/dedupeCandidates";
import type { CandidateLead } from "../../src/search-agent/schemas";

function makeCandidate(overrides: Partial<CandidateLead> & { id: string; name: string }): CandidateLead {
  const now = new Date().toISOString();
  return {
    missionId: "m1",
    type: "company",
    websiteUrl: "https://example.com",
    domain: "example.com",
    sourceUrls: ["https://example.com"],
    contact: { emails: [], phones: [] },
    evidence: [],
    scores: {
      fitScore: 50,
      contactabilityScore: 50,
      evidenceQualityScore: 50,
      overallScore: 50,
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

describe("dedupeCandidates", () => {
  it("merges candidates with same domain", () => {
    const a = makeCandidate({
      id: "a",
      name: "Example Co",
      websiteUrl: "https://example.com",
      domain: "example.com",
      scores: { fitScore: 60, contactabilityScore: 40, evidenceQualityScore: 40, overallScore: 52 },
    });
    const b = makeCandidate({
      id: "b",
      name: "Example Company",
      websiteUrl: "https://www.example.com/page",
      domain: "example.com",
      scores: { fitScore: 70, contactabilityScore: 50, evidenceQualityScore: 50, overallScore: 62 },
    });

    const { candidates, duplicatesRemoved } = dedupeCandidates([a, b]);
    expect(candidates).toHaveLength(1);
    expect(duplicatesRemoved).toBe(1);
    expect(candidates[0].scores.overallScore).toBe(62);
  });
});
