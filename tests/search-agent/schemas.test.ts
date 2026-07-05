import { describe, it, expect } from "vitest";
import {
  SearchAgentInputSchema,
  SearchAgentOutputSchema,
} from "../../src/search-agent/schemas";

describe("SearchAgentInput schema", () => {
  it("validates a minimal valid input", () => {
    const result = SearchAgentInputSchema.safeParse({
      requestId: "req_1",
      businessProfile: {
        businessId: "biz_1",
        businessName: "CallPilot AI",
        whatWeSell: "AI receptionist",
      },
      mission: {
        missionId: "m_1",
        goalType: "find_clients",
        description: "Find plumbers in Lyon",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid goalType", () => {
    const result = SearchAgentInputSchema.safeParse({
      requestId: "req_1",
      businessProfile: {
        businessId: "biz_1",
        businessName: "Test",
        whatWeSell: "Something",
      },
      mission: {
        missionId: "m_1",
        goalType: "invalid",
        description: "Test",
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("SearchAgentOutput schema", () => {
  it("validates output shape from mock run structure", () => {
    const result = SearchAgentOutputSchema.safeParse({
      requestId: "req_1",
      missionId: "m_1",
      status: "success",
      searchPlan: {
        interpretedGoal: "Find clients",
        targetPersonas: ["owner"],
        targetSegments: ["plumbers"],
        goodFitSignals: ["local"],
        badFitSignals: ["enterprise"],
        suggestedSources: ["web"],
        generatedQueries: ["plombier Lyon"],
        assumptions: ["public web"],
      },
      candidates: [],
      groups: {
        highFit: [],
        promisingButIncomplete: [],
        needsVerification: [],
        rejectedOrLowFit: [],
      },
      summary: {
        queriesRun: 1,
        rawResultsFound: 4,
        pagesFetched: 4,
        candidatesCreated: 4,
        duplicatesRemoved: 0,
        highFitCount: 1,
        warningCount: 0,
      },
      warnings: [],
      trace: [],
    });
    expect(result.success).toBe(true);
  });
});
