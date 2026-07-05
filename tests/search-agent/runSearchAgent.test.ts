import { describe, it, expect } from "vitest";
import { runSearchAgent } from "../../src/search-agent/runSearchAgent";
import { SearchAgentOutputSchema } from "../../src/search-agent/schemas";
import { MockSearchProvider } from "../../src/search-agent/providers/MockSearchProvider";
import { MockPageFetcher } from "../../src/search-agent/fetch/MockPageFetcher";
import { toDiscoverCard } from "../../src/search-agent/view-models/toDiscoverCard";

const exampleInput = {
  requestId: "req_test",
  businessProfile: {
    businessId: "biz_callpilot",
    businessName: "CallPilot AI",
    businessType: "B2B SaaS",
    whatWeSell: "AI phone receptionist for small service businesses",
    valueProposition: "Answer missed calls 24/7",
    targetGeographies: ["France"],
    idealCustomers: ["small local service companies that receive many calls"],
    badFitCustomers: ["very large enterprises"],
    languages: ["fr"],
  },
  mission: {
    missionId: "mission_lyon",
    goalType: "find_clients" as const,
    description:
      "Find small construction service businesses in Lyon likely to need AI call reception.",
    targetLocation: "Lyon",
    targetIndustry: "construction services",
    language: "fr",
  },
  searchOptions: {
    maxQueries: 4,
    maxResultsPerQuery: 8,
    maxPagesToFetch: 12,
    allowLLM: false,
  },
  providerOptions: { provider: "mock" as const },
};

describe("runSearchAgent integration", () => {
  it("runs end-to-end with mock provider and validates output", async () => {
    const output = await runSearchAgent(exampleInput, {
      searchProvider: new MockSearchProvider(),
      pageFetcher: new MockPageFetcher(),
    });

    expect(SearchAgentOutputSchema.safeParse(output).success).toBe(true);
    expect(output.status).toMatch(/success|partial_success/);
    expect(output.candidates.length).toBeGreaterThan(0);
    expect(output.summary.queriesRun).toBeGreaterThan(0);
    expect(output.summary.pagesFetched).toBeGreaterThan(0);
  });

  it("classifies Rhône Plomberie as high_fit", async () => {
    const output = await runSearchAgent(exampleInput, {
      searchProvider: new MockSearchProvider(),
      pageFetcher: new MockPageFetcher(),
    });

    const rhone = output.candidates.find((c) =>
      c.name.toLowerCase().includes("rhône") || c.domain === "rhoneplomberie.fr",
    );
    expect(rhone).toBeDefined();
    expect(rhone!.classification.category).toBe("high_fit");
    expect(rhone!.scores.overallScore).toBeGreaterThanOrEqual(75);
  });

  it("classifies Paris Enterprise as rejected_or_low_fit", async () => {
    const output = await runSearchAgent(exampleInput, {
      searchProvider: new MockSearchProvider(),
      pageFetcher: new MockPageFetcher(),
    });

    const enterprise = output.candidates.find((c) =>
      c.name.toLowerCase().includes("paris enterprise"),
    );
    expect(enterprise).toBeDefined();
    expect(enterprise!.classification.category).toBe("rejected_or_low_fit");
  });

  it("groups candidates into correct buckets", async () => {
    const output = await runSearchAgent(exampleInput, {
      searchProvider: new MockSearchProvider(),
      pageFetcher: new MockPageFetcher(),
    });

    const allGrouped = [
      ...output.groups.highFit,
      ...output.groups.promisingButIncomplete,
      ...output.groups.needsVerification,
      ...output.groups.rejectedOrLowFit,
    ];
    expect(allGrouped).toHaveLength(output.candidates.length);
    expect(output.groups.highFit.length).toBeGreaterThanOrEqual(1);
    expect(output.groups.rejectedOrLowFit.length).toBeGreaterThanOrEqual(1);
  });

  it("maps top candidate to discover card VM", async () => {
    const output = await runSearchAgent(exampleInput, {
      searchProvider: new MockSearchProvider(),
      pageFetcher: new MockPageFetcher(),
    });

    const top = output.candidates[0];
    const card = toDiscoverCard(top);
    expect(card.id).toBe(top.id);
    expect(card.title).toBeTruthy();
    expect(card.fitScore).toBe(top.scores.overallScore);
    expect(card.primaryActionLabel).toBeTruthy();
  });
});
