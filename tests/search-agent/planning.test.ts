import { describe, it, expect } from "vitest";
import {
  buildMissionUnderstanding,
  generateFallbackSearchPlan,
  generateQueries,
} from "../../src/search-agent/planning/fallbackSearchPlan";

const businessProfile = {
  businessId: "biz_callpilot",
  businessName: "CallPilot AI",
  businessType: "B2B SaaS",
  whatWeSell: "AI phone receptionist for small service businesses",
  valueProposition: "Answer missed calls 24/7",
  targetGeographies: ["France"],
  idealCustomers: ["small local service companies that receive many calls"],
  badFitCustomers: ["very large enterprises"],
  languages: ["fr"],
};

const mission = {
  missionId: "mission_lyon",
  goalType: "find_clients" as const,
  description:
    "Find small construction service businesses in Lyon likely to need AI call reception.",
  targetLocation: "Lyon",
  targetIndustry: "construction services",
  language: "fr",
};

describe("fallback search plan", () => {
  it("generates personas and signals for find_clients", () => {
    const understanding = buildMissionUnderstanding(businessProfile, mission);
    const plan = generateFallbackSearchPlan(
      businessProfile,
      mission,
      understanding,
    );

    expect(plan.targetPersonas).toContain("owner");
    expect(plan.goodFitSignals).toContain("phone-first workflow");
    expect(plan.targetSegments.some((s) => s.includes("plumb"))).toBe(true);
  });

  it("generates French queries for Lyon construction example", () => {
    const understanding = buildMissionUnderstanding(businessProfile, mission);
    const queries = generateQueries(
      mission,
      businessProfile,
      understanding,
      "construction services",
      "Lyon",
      6,
    );

    expect(queries.some((q) => q.includes("Lyon"))).toBe(true);
    expect(
      queries.some(
        (q) =>
          q.includes("plombier") ||
          q.includes("rénovation") ||
          q.includes("BTP"),
      ),
    ).toBe(true);
  });

  it("includes hiring warning segments for find_hires", () => {
    const hireMission = { ...mission, goalType: "find_hires" as const };
    const understanding = buildMissionUnderstanding(businessProfile, hireMission);
    const plan = generateFallbackSearchPlan(
      businessProfile,
      hireMission,
      understanding,
    );
    expect(plan.suggestedSources).toContain("linkedin_public");
  });
});
