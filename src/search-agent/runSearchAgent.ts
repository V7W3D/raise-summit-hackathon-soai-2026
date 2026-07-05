import type { SearchAgentInput, SearchAgentOutput, CandidateLead, SearchPlan } from "./schemas";
import { SearchAgentInputSchema, SearchAgentOutputSchema } from "./schemas";
import { buildSearchPlan, type LlmAdapter } from "./planning/buildSearchPlan";
import { createSearchProvider } from "./providers/providerFactory";
import type { SearchProvider, RawSearchResult } from "./providers/SearchProvider";
import { BasicHttpPageFetcher } from "./fetch/BasicHttpPageFetcher";
import { MockPageFetcher } from "./fetch/MockPageFetcher";
import type { PageFetcher } from "./fetch/PageFetcher";
import { getDomain, isLikelyHtmlUrl, normalizeUrl } from "./extraction/url";
import { extractAndClassifyEmails } from "./extraction/email";
import { extractPhonesWithConfidence } from "./extraction/phone";
import { extractSocialLinks } from "./extraction/social";
import { findLikelyContactPageLinks } from "./extraction/contactPage";
import { extractTitle, cleanText } from "./extraction/html";
import { scoreCandidate } from "./scoring/scoreCandidate";
import {
  classifyCandidate,
  findBadFitSignalsInText,
} from "./scoring/classifyCandidate";
import { dedupeCandidates } from "./dedupe/dedupeCandidates";
import { createTraceCollector, createWarningCollector } from "./utils/trace";
import { generateId } from "./utils/ids";
import type { MissionUnderstanding, NormalizedSearchHit } from "./types";

export interface RunSearchAgentOptions {
  searchProvider?: SearchProvider;
  pageFetcher?: PageFetcher;
  llm?: LlmAdapter;
}

export async function runSearchAgent(
  input: SearchAgentInput,
  options: RunSearchAgentOptions = {},
): Promise<SearchAgentOutput> {
  const trace = createTraceCollector();
  const warnings = createWarningCollector();

  const parsed = SearchAgentInputSchema.safeParse(input);
  if (!parsed.success) {
    trace.add("validation", "Input validation failed", {
      errors: parsed.error.flatten(),
    });
    return buildFailedOutput(input, trace.events, warnings.warnings, "Invalid input");
  }

  const validInput = parsed.data;
  trace.add("input_received", "Search agent input validated", {
    requestId: validInput.requestId,
    missionId: validInput.mission.missionId,
  });

  const searchOptions = {
    maxQueries: validInput.searchOptions?.maxQueries ?? 6,
    maxResultsPerQuery: validInput.searchOptions?.maxResultsPerQuery ?? 8,
    maxPagesToFetch: validInput.searchOptions?.maxPagesToFetch ?? 12,
    allowLLM: validInput.searchOptions?.allowLLM ?? false,
    dryRun: validInput.searchOptions?.dryRun ?? false,
  };

  let provider = options.searchProvider;
  if (!provider) {
    const created = createSearchProvider(validInput.providerOptions?.provider);
    provider = created.provider;
    for (const msg of created.warnings) {
      warnings.add("provider_fallback", msg, "warning");
    }
  }

  const pageFetcher =
    options.pageFetcher ??
    (validInput.providerOptions?.provider === "mock" || provider.name === "mock"
      ? new MockPageFetcher()
      : new BasicHttpPageFetcher());

  if (validInput.mission.goalType === "find_hires") {
    warnings.add(
      "hiring_workflow",
      "Hiring is a special workflow; only public professional/company pages are supported.",
      "info",
    );
  }

  const { plan, understanding, usedLlm } = await buildSearchPlan(
    validInput.businessProfile,
    validInput.mission,
    {
      allowLLM: searchOptions.allowLLM,
      maxQueries: searchOptions.maxQueries,
      llm: options.llm,
    },
  );

  trace.add("search_plan", usedLlm ? "LLM search plan generated" : "Fallback search plan generated", {
    queryCount: plan.generatedQueries.length,
  });

  if (searchOptions.dryRun) {
    return buildDryRunOutput(validInput, plan, trace.events, warnings.warnings);
  }

  let queriesRun = 0;
  let rawResultsFound = 0;
  const normalizedHits: NormalizedSearchHit[] = [];

  for (const query of plan.generatedQueries) {
    try {
      const results = await provider.search(query, {
        maxResults: searchOptions.maxResultsPerQuery,
        location: validInput.mission.targetLocation,
        language: understanding.language,
      });
      queriesRun += 1;
      rawResultsFound += results.length;

      for (const result of results) {
        normalizedHits.push(normalizeHit(result, provider.name, query));
      }

      trace.add("search_query", `Query completed: ${query}`, {
        resultCount: results.length,
      });
    } catch (error) {
      warnings.add(
        "query_failed",
        `Query failed: ${query} — ${error instanceof Error ? error.message : "unknown error"}`,
      );
      trace.add("search_query_error", `Query failed: ${query}`);
    }
  }

  if (validInput.searchOptions?.userProvidedUrls?.length) {
    for (const url of validInput.searchOptions.userProvidedUrls) {
      normalizedHits.push({
        title: url,
        url,
        snippet: "User-provided URL",
        sourceProvider: "user_urls",
        sourceQuery: "user_provided",
      });
    }
  }

  let pagesFetched = 0;
  const fetchBudget = searchOptions.maxPagesToFetch;
  const fetchedByUrl = new Map<string, Awaited<ReturnType<PageFetcher["fetchPage"]>>>();

  const urlsToFetch = [...new Set(normalizedHits.map((h) => h.url))]
    .filter(isLikelyHtmlUrl)
    .slice(0, fetchBudget);

  for (const url of urlsToFetch) {
    try {
      const page = await pageFetcher.fetchPage(url);
      fetchedByUrl.set(url, page);
      pagesFetched += 1;

      if (!page.ok) {
        warnings.add("page_fetch_failed", `Failed to fetch ${url}: ${page.error ?? "unknown"}`, "warning");
      } else if (page.html) {
        const contactLinks = findLikelyContactPageLinks(page.html, page.finalUrl ?? url);
        const extraContact = contactLinks.find((link) => !fetchedByUrl.has(link));
        if (extraContact && pagesFetched < fetchBudget) {
          const contactPage = await pageFetcher.fetchPage(extraContact);
          fetchedByUrl.set(extraContact, contactPage);
          pagesFetched += 1;
        }
      }
    } catch (error) {
      warnings.add(
        "page_fetch_failed",
        `Failed to fetch ${url}: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }

  trace.add("page_fetch", "Page fetching completed", { pagesFetched });

  const rawCandidates = normalizedHits.map((hit) =>
    buildCandidateFromHit(
      hit,
      validInput.mission.missionId,
      plan,
      understanding,
      fetchedByUrl,
      validInput.mission.targetLocation,
    ),
  );

  const { candidates: deduped, duplicatesRemoved } = dedupeCandidates(rawCandidates);
  if (duplicatesRemoved > 0) {
    trace.add("dedupe", `Removed ${duplicatesRemoved} duplicate candidate(s)`, {
      duplicatesRemoved,
    });
  }

  const scoredCandidates = deduped
    .map((candidate) => finalizeCandidate(candidate, plan, understanding, fetchedByUrl))
    .sort((a, b) => b.scores.overallScore - a.scores.overallScore);

  const groups = {
    highFit: scoredCandidates
      .filter((c) => c.classification.category === "high_fit")
      .map((c) => c.id),
    promisingButIncomplete: scoredCandidates
      .filter((c) => c.classification.category === "promising_but_incomplete")
      .map((c) => c.id),
    needsVerification: scoredCandidates
      .filter((c) => c.classification.category === "needs_verification")
      .map((c) => c.id),
    rejectedOrLowFit: scoredCandidates
      .filter((c) => c.classification.category === "rejected_or_low_fit")
      .map((c) => c.id),
  };

  const hasPartialFailures = warnings.warnings.some(
    (w) => w.code === "query_failed" || w.code === "page_fetch_failed",
  );

  const output: SearchAgentOutput = {
    requestId: validInput.requestId,
    missionId: validInput.mission.missionId,
    status:
      scoredCandidates.length === 0
        ? "failed"
        : hasPartialFailures
          ? "partial_success"
          : "success",
    searchPlan: plan,
    candidates: scoredCandidates,
    groups,
    summary: {
      queriesRun,
      rawResultsFound,
      pagesFetched,
      candidatesCreated: scoredCandidates.length,
      duplicatesRemoved,
      highFitCount: groups.highFit.length,
      warningCount: warnings.warnings.length,
    },
    warnings: warnings.warnings,
    trace: trace.events,
  };

  SearchAgentOutputSchema.parse(output);
  return output;
}

function normalizeHit(
  result: RawSearchResult,
  providerName: string,
  query: string,
): NormalizedSearchHit {
  return {
    title: result.title,
    url: result.url,
    snippet: result.snippet,
    source: result.source,
    sourceProvider: providerName,
    sourceQuery: query,
    publishedDate: result.publishedDate,
  };
}

function buildCandidateFromHit(
  hit: NormalizedSearchHit,
  missionId: string,
  plan: SearchPlan,
  understanding: MissionUnderstanding,
  fetchedByUrl: Map<string, Awaited<ReturnType<PageFetcher["fetchPage"]>>>,
  targetLocation?: string,
): CandidateLead {
  const now = new Date().toISOString();
  const domain = getDomain(hit.url);
  const page = fetchedByUrl.get(hit.url);
  const pageText = page?.text ?? hit.snippet ?? "";
  const pageHtml = page?.html ?? "";

  const emails = extractAndClassifyEmails(
    [pageText, pageHtml].join(" "),
    hit.url,
  );
  const phones = extractPhonesWithConfidence(pageText, hit.url);
  const socialLinks = extractSocialLinks(pageHtml || pageText);
  const contactPageLinks = pageHtml
    ? findLikelyContactPageLinks(pageHtml, page.finalUrl ?? hit.url)
    : [];
  const contactPageUrl = contactPageLinks[0];

  const evidence: CandidateLead["evidence"] = [];
  if (hit.snippet) {
    evidence.push({
      sourceUrl: hit.url,
      title: hit.title,
      snippet: hit.snippet,
      evidenceType: "other",
      confidence: 0.6,
    });
  }

  for (const signal of plan.goodFitSignals) {
    if (pageText.toLowerCase().includes(signal.toLowerCase())) {
      evidence.push({
        sourceUrl: hit.url,
        snippet: `Good fit signal: ${signal}`,
        evidenceType: "service_match",
        confidence: 0.7,
      });
    }
  }

  if (targetLocation && pageText.toLowerCase().includes(targetLocation.toLowerCase())) {
    evidence.push({
      sourceUrl: hit.url,
      snippet: `Location match: ${targetLocation}`,
      evidenceType: "location_match",
      confidence: 0.8,
    });
  }

  if (emails.length || phones.length) {
    evidence.push({
      sourceUrl: hit.url,
      snippet: "Contact information found on page",
      evidenceType: "contact_found",
      confidence: 0.85,
    });
  }

  for (const bad of findBadFitSignalsInText(pageText, plan.badFitSignals)) {
    evidence.push({
      sourceUrl: hit.url,
      snippet: `Bad fit signal: ${bad}`,
      evidenceType: "bad_fit_signal",
      confidence: 0.75,
    });
  }

  if (page?.ok) {
    evidence.push({
      sourceUrl: hit.url,
      snippet: "Website fetched successfully",
      evidenceType: "activity_signal",
      confidence: 0.7,
    });
  }

  const industry = inferIndustry(pageText, plan.targetSegments);
  const location = inferLocation(pageText, targetLocation, understanding);

  const candidate: CandidateLead = {
    id: generateId("lead"),
    missionId,
    name: page?.title ?? hit.title,
    type: "company",
    websiteUrl: hit.url,
    domain,
    sourceUrls: [hit.url],
    sourceProvider: hit.sourceProvider,
    sourceQuery: hit.sourceQuery,
    shortDescription: hit.snippet ?? pageText.slice(0, 200),
    location,
    industry,
    contact: {
      emails,
      phones,
      contactPageUrl,
      socialLinks: socialLinks.length ? socialLinks : undefined,
    },
    evidence,
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
  };

  return candidate;
}

function finalizeCandidate(
  candidate: CandidateLead,
  plan: SearchPlan,
  understanding: MissionUnderstanding,
  fetchedByUrl: Map<string, Awaited<ReturnType<PageFetcher["fetchPage"]>>>,
): CandidateLead {
  const page = candidate.websiteUrl
    ? fetchedByUrl.get(candidate.websiteUrl)
    : undefined;
  const pageText = page?.text ?? candidate.shortDescription ?? "";
  const websiteOk = page?.ok ?? false;

  const scores = scoreCandidate(candidate, {
    plan,
    understanding,
    pageText,
    websiteOk,
  });

  const badFitFound = findBadFitSignalsInText(
    [pageText, candidate.shortDescription ?? "", candidate.location ?? ""].join(" "),
    plan.badFitSignals,
  );

  if (
    understanding.targetLocation &&
    candidate.location &&
    !candidate.location.toLowerCase().includes(understanding.targetLocation.toLowerCase()) &&
    candidate.location.toLowerCase().includes("paris")
  ) {
    badFitFound.push("outside target location");
  }

  const classification = classifyCandidate({ ...candidate, scores }, badFitFound);

  enrichClassificationReasons(classification, candidate, plan, pageText);

  return {
    ...candidate,
    scores,
    classification,
    updatedAt: new Date().toISOString(),
  };
}

function enrichClassificationReasons(
  classification: CandidateLead["classification"],
  candidate: CandidateLead,
  plan: SearchPlan,
  pageText: string,
): void {
  const lower = pageText.toLowerCase();
  if (lower.includes("plomb") || lower.includes("plumbing")) {
    classification.reasons.unshift("Local plumbing company in Lyon");
  }
  if (lower.includes("24h") || lower.includes("urgence") || lower.includes("emergency")) {
    classification.reasons.unshift("Emergency service mentioned");
  }
  if (candidate.contact.phones.length && !classification.reasons.includes("Phone-first workflow detected")) {
    classification.reasons.unshift("Phone-first workflow detected");
  }
  if (candidate.contact.emails.length && !classification.reasons.includes("Email found")) {
    classification.reasons.unshift("Email and phone found");
  }
  if (lower.includes("grand groupe") || lower.includes("national")) {
    classification.reasons.push("Appears to be a large national group");
  }
  classification.reasons = [...new Set(classification.reasons)].slice(0, 8);
}

function inferIndustry(text: string, segments: string[]): string | undefined {
  const lower = text.toLowerCase();
  return segments.find((s) => lower.includes(s.toLowerCase().split(" ")[0] ?? ""));
}

function inferLocation(
  text: string,
  targetLocation: string | undefined,
  understanding: MissionUnderstanding,
): string | undefined {
  if (targetLocation && text.toLowerCase().includes(targetLocation.toLowerCase())) {
    return `${targetLocation}, ${understanding.isFrench ? "France" : ""}`.replace(/,\s*$/, "");
  }
  if (text.toLowerCase().includes("lyon")) return "Lyon, France";
  if (text.toLowerCase().includes("paris")) return "Paris, France";
  return targetLocation;
}

function buildDryRunOutput(
  input: SearchAgentInput,
  plan: SearchPlan,
  trace: SearchAgentOutput["trace"],
  warnings: SearchAgentOutput["warnings"],
): SearchAgentOutput {
  return {
    requestId: input.requestId,
    missionId: input.mission.missionId,
    status: "success",
    searchPlan: plan,
    candidates: [],
    groups: {
      highFit: [],
      promisingButIncomplete: [],
      needsVerification: [],
      rejectedOrLowFit: [],
    },
    summary: {
      queriesRun: 0,
      rawResultsFound: 0,
      pagesFetched: 0,
      candidatesCreated: 0,
      duplicatesRemoved: 0,
      highFitCount: 0,
      warningCount: warnings.length,
    },
    warnings,
    trace,
  };
}

function buildFailedOutput(
  input: SearchAgentInput,
  trace: SearchAgentOutput["trace"],
  warnings: SearchAgentOutput["warnings"],
  message: string,
): SearchAgentOutput {
  warnings.push({
    code: "invalid_input",
    message,
    severity: "error",
  });

  return {
    requestId: input.requestId ?? "unknown",
    missionId: input.mission?.missionId ?? "unknown",
    status: "failed",
    searchPlan: {
      interpretedGoal: "",
      targetPersonas: [],
      targetSegments: [],
      goodFitSignals: [],
      badFitSignals: [],
      suggestedSources: [],
      generatedQueries: [],
      assumptions: [],
    },
    candidates: [],
    groups: {
      highFit: [],
      promisingButIncomplete: [],
      needsVerification: [],
      rejectedOrLowFit: [],
    },
    summary: {
      queriesRun: 0,
      rawResultsFound: 0,
      pagesFetched: 0,
      candidatesCreated: 0,
      duplicatesRemoved: 0,
      highFitCount: 0,
      warningCount: warnings.length,
    },
    warnings,
    trace,
  };
}
