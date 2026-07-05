import type { BusinessProfile, Mission, SearchPlan } from "../schemas";
import type { MissionUnderstanding } from "../types";
import { extractJsonFromText, safeJsonParse } from "../utils/safeJson";
import {
  generateFallbackSearchPlan,
  buildMissionUnderstanding,
} from "./fallbackSearchPlan";

const SEARCH_PLAN_PROMPT = `You are a prospecting strategy agent for small businesses.
Given the saved business profile and a prospecting mission, produce a search plan.
Return JSON only.
Generate:
- interpretedGoal
- targetPersonas
- targetSegments
- goodFitSignals
- badFitSignals
- suggestedSources
- generatedQueries
- assumptions
Rules:
- Be specific.
- Do not recommend spam.
- Do not search behind logins.
- Prefer public business websites, directories, maps, public pages.
- Generate queries likely to find real companies and contact pages.
- Include local-language queries when location/language suggests it.
- Avoid illegal or platform-violating automation.`;

export interface LlmAdapter {
  complete(prompt: string): Promise<string>;
}

export async function buildSearchPlanWithLlm(
  businessProfile: BusinessProfile,
  mission: Mission,
  understanding: MissionUnderstanding,
  llm: LlmAdapter,
  maxQueries: number,
): Promise<SearchPlan | null> {
  const userContent = JSON.stringify({
    businessProfile,
    mission,
    understanding,
    maxQueries,
  });

  try {
    const response = await llm.complete(`${SEARCH_PLAN_PROMPT}\n\nInput:\n${userContent}`);
    const jsonText = extractJsonFromText(response);
    if (!jsonText) return null;

    const parsed = safeJsonParse<Partial<SearchPlan>>(jsonText);
    if (!parsed?.interpretedGoal || !Array.isArray(parsed.generatedQueries)) {
      return null;
    }

    return {
      interpretedGoal: parsed.interpretedGoal,
      targetPersonas: parsed.targetPersonas ?? [],
      targetSegments: parsed.targetSegments ?? [],
      goodFitSignals: parsed.goodFitSignals ?? [],
      badFitSignals: parsed.badFitSignals ?? [],
      suggestedSources: parsed.suggestedSources ?? ["web"],
      generatedQueries: parsed.generatedQueries.slice(0, maxQueries),
      assumptions: parsed.assumptions ?? ["LLM-generated plan"],
    };
  } catch {
    return null;
  }
}

export async function buildSearchPlan(
  businessProfile: BusinessProfile,
  mission: Mission,
  options: { allowLLM?: boolean; maxQueries?: number; llm?: LlmAdapter },
): Promise<{ plan: SearchPlan; understanding: MissionUnderstanding; usedLlm: boolean }> {
  const understanding = buildMissionUnderstanding(businessProfile, mission);
  const maxQueries = options.maxQueries ?? 6;

  if (options.allowLLM && options.llm) {
    const llmPlan = await buildSearchPlanWithLlm(
      businessProfile,
      mission,
      understanding,
      options.llm,
      maxQueries,
    );
    if (llmPlan) {
      return { plan: llmPlan, understanding, usedLlm: true };
    }
  }

  return {
    plan: generateFallbackSearchPlan(
      businessProfile,
      mission,
      understanding,
      maxQueries,
    ),
    understanding,
    usedLlm: false,
  };
}

export { buildMissionUnderstanding, generateFallbackSearchPlan, generateQueries } from "./fallbackSearchPlan";
