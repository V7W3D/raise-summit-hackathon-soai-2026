#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runSearchAgent } from "../src/search-agent/runSearchAgent";
import { toDiscoverCard } from "../src/search-agent/view-models/toDiscoverCard";
import { MockSearchProvider } from "../src/search-agent/providers/MockSearchProvider";
import { MockPageFetcher } from "../src/search-agent/fetch/MockPageFetcher";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const output = await runSearchAgent(
  {
    requestId: crypto.randomUUID(),
    businessProfile: {
      businessId: "biz_callpilot",
      businessName: "CallPilot AI",
      businessType: "B2B SaaS",
      whatWeSell: "AI phone receptionist for small service businesses",
      valueProposition:
        "Answer missed calls 24/7, capture leads, summarize calls, and help business owners call back faster",
      targetGeographies: ["France"],
      idealCustomers: [
        "small local service companies that receive many calls",
      ],
      badFitCustomers: [
        "very large enterprises",
        "businesses with no phone-based workflow",
        "inactive companies",
      ],
      languages: ["fr"],
    },
    mission: {
      missionId: "mission_lyon_construction",
      title: "Lyon construction prospects",
      goalType: "find_clients",
      description:
        "Find small construction service businesses in Lyon likely to need AI call reception.",
      targetLocation: "Lyon",
      targetIndustry: "construction services",
      targetBusinessSize: "small",
      desiredLeadCount: 20,
      urgency: "medium",
      language: "fr",
    },
    searchOptions: {
      maxQueries: 4,
      maxResultsPerQuery: 8,
      maxPagesToFetch: 12,
      includeSources: ["web", "directories", "maps"],
      allowLLM: false,
    },
    providerOptions: {
      provider: (process.env.SEARCH_PROVIDER as "mock" | "exa" | "tavily" | "brave" | "serper" | undefined) ?? "mock",
    },
  },
  {
    searchProvider: process.env.SEARCH_PROVIDER && process.env.SEARCH_PROVIDER !== "mock"
      ? undefined
      : new MockSearchProvider(),
    pageFetcher: process.env.SEARCH_PROVIDER && process.env.SEARCH_PROVIDER !== "mock"
      ? undefined
      : new MockPageFetcher(),
  },
);

console.log("\n=== Search Plan ===");
console.log("Interpreted goal:", output.searchPlan.interpretedGoal);
console.log("\nGenerated queries:");
for (const q of output.searchPlan.generatedQueries) {
  console.log(`- ${q}`);
}

console.log("\n=== Summary ===");
console.log(JSON.stringify(output.summary, null, 2));

console.log("\n=== Grouped Candidates ===");
console.log("high_fit:", output.groups.highFit.length);
console.log("promising_but_incomplete:", output.groups.promisingButIncomplete.length);
console.log("needs_verification:", output.groups.needsVerification.length);
console.log("rejected_or_low_fit:", output.groups.rejectedOrLowFit.length);

console.log("\n=== Top Candidates ===");
for (const candidate of output.candidates.slice(0, 4)) {
  const card = toDiscoverCard(candidate);
  console.log(`\n${card.title}`);
  console.log(`  overallScore: ${candidate.scores.overallScore}`);
  console.log(`  category: ${candidate.classification.category}`);
  console.log("  reasons:");
  for (const reason of candidate.classification.reasons.slice(0, 5)) {
    console.log(`  - ${reason}`);
  }
  console.log("  missingInfo:");
  for (const info of candidate.classification.missingInfo.slice(0, 3)) {
    console.log(`  - ${info}`);
  }
  console.log(`  recommendedNextAction: ${candidate.classification.recommendedNextAction}`);
}

const outPath = join(rootDir, "tmp", "search-agent-output.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nFull output written to ${outPath}`);
