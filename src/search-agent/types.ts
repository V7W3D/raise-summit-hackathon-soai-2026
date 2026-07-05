export type { SearchAgentInput, SearchAgentOutput, CandidateLead, SearchPlan } from "./schemas";

export interface MissionUnderstanding {
  goalType: string;
  description: string;
  targetLocation?: string;
  targetIndustry?: string;
  language: string;
  isFrench: boolean;
  businessContext: string;
}

export interface NormalizedSearchHit {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  sourceProvider: string;
  sourceQuery: string;
  publishedDate?: string;
}

export interface ExtractedPageData {
  url: string;
  finalUrl?: string;
  status?: number;
  ok: boolean;
  title?: string;
  text?: string;
  domain?: string;
  emails: Array<{ value: string; type: "generic" | "personal" | "unknown"; confidence: number; sourceUrl?: string }>;
  phones: Array<{ value: string; confidence: number; sourceUrl?: string }>;
  socialLinks: Array<{ platform: "linkedin" | "facebook" | "instagram" | "x" | "other"; url: string }>;
  contactPageUrl?: string;
  error?: string;
}
