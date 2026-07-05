import type { CandidateLead, SearchPlan } from "../schemas";
import type { MissionUnderstanding } from "../types";

export interface ScoringContext {
  plan: SearchPlan;
  understanding: MissionUnderstanding;
  pageText?: string;
  websiteOk: boolean;
}

function countKeywordMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
}

export function scoreCandidate(
  candidate: Pick<
    CandidateLead,
    "name" | "shortDescription" | "location" | "industry" | "contact" | "evidence"
  >,
  context: ScoringContext,
): CandidateLead["scores"] {
  const textBlob = [
    candidate.name,
    candidate.shortDescription ?? "",
    candidate.location ?? "",
    candidate.industry ?? "",
    context.pageText ?? "",
    ...candidate.evidence.map((e) => e.snippet),
  ].join(" ");

  const locationKeywords = [
    context.understanding.targetLocation ?? "",
    ...(context.plan.targetSegments ?? []),
  ].filter(Boolean);

  const industryKeywords = [
    context.understanding.targetIndustry ?? "",
    ...context.plan.targetSegments,
  ].filter(Boolean);

  let fitScore = 30;
  fitScore += Math.min(25, countKeywordMatches(textBlob, industryKeywords) * 8);
  fitScore += Math.min(20, countKeywordMatches(textBlob, locationKeywords) * 10);
  fitScore += Math.min(15, countKeywordMatches(textBlob, context.plan.goodFitSignals) * 5);
  fitScore -= Math.min(30, countKeywordMatches(textBlob, context.plan.badFitSignals) * 10);

  const hasLocationMatch = locationKeywords.some(
    (kw) => kw && textBlob.toLowerCase().includes(kw.toLowerCase()),
  );
  const hasIndustryMatch = industryKeywords.some(
    (kw) => kw && textBlob.toLowerCase().includes(kw.toLowerCase()),
  );
  if (hasLocationMatch && hasIndustryMatch) {
    fitScore += 12;
  }

  if (context.websiteOk) fitScore += 10;
  fitScore += Math.min(10, candidate.evidence.length * 3);
  if (
    candidate.contact.emails.length &&
    candidate.contact.phones.length &&
    candidate.contact.contactPageUrl
  ) {
    fitScore += 8;
  }
  fitScore = clamp(fitScore, 0, 100);

  let contactabilityScore = 0;
  if (candidate.contact.emails.length) contactabilityScore += 35;
  if (candidate.contact.phones.length) contactabilityScore += 35;
  if (candidate.contact.contactPageUrl) contactabilityScore += 15;
  if (candidate.contact.socialLinks?.length) contactabilityScore += 5;
  if (candidate.contact.emails.some((e) => e.type === "personal")) {
    contactabilityScore += 10;
  } else if (candidate.contact.emails.some((e) => e.type === "generic")) {
    contactabilityScore += 5;
  }
  contactabilityScore = clamp(contactabilityScore, 0, 100);

  let evidenceQualityScore = 20;
  if (context.websiteOk) evidenceQualityScore += 25;
  if (candidate.evidence.length >= 2) evidenceQualityScore += 20;
  const evidenceTypes = new Set(candidate.evidence.map((e) => e.evidenceType));
  evidenceQualityScore += Math.min(20, evidenceTypes.size * 5);
  if (candidate.evidence.some((e) => e.snippet.length > 30)) {
    evidenceQualityScore += 15;
  }
  evidenceQualityScore = clamp(evidenceQualityScore, 0, 100);

  const overallScore = Math.round(
    fitScore * 0.5 + contactabilityScore * 0.3 + evidenceQualityScore * 0.2,
  );

  const contactBonus =
    candidate.contact.emails.length && candidate.contact.phones.length ? 5 : 0;

  return {
    fitScore,
    contactabilityScore,
    evidenceQualityScore,
    overallScore: clamp(overallScore + contactBonus, 0, 100),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
