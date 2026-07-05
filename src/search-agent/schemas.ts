import { z } from "zod";

export const BusinessProfileSchema = z.object({
  businessId: z.string(),
  businessName: z.string(),
  businessType: z.string().optional(),
  description: z.string().optional(),
  whatWeSell: z.string(),
  valueProposition: z.string().optional(),
  targetGeographies: z.array(z.string()).optional(),
  idealCustomers: z.array(z.string()).optional(),
  badFitCustomers: z.array(z.string()).optional(),
  preferredTone: z.string().optional(),
  languages: z.array(z.string()).optional(),
});

export const MissionSchema = z.object({
  missionId: z.string(),
  title: z.string().optional(),
  goalType: z.enum([
    "find_clients",
    "find_suppliers",
    "find_consultants",
    "find_partners",
    "find_investors",
    "find_hires",
  ]),
  description: z.string(),
  targetLocation: z.string().optional(),
  targetIndustry: z.string().optional(),
  targetBusinessSize: z.string().optional(),
  desiredLeadCount: z.number().optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  language: z.string().optional(),
});

export const SearchOptionsSchema = z.object({
  maxQueries: z.number().optional(),
  maxResultsPerQuery: z.number().optional(),
  maxPagesToFetch: z.number().optional(),
  includeSources: z
    .array(
      z.enum(["web", "maps", "directories", "linkedin_public", "user_urls"]),
    )
    .optional(),
  userProvidedUrls: z.array(z.string()).optional(),
  freshnessDays: z.number().optional(),
  allowLLM: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

export const ProviderOptionsSchema = z.object({
  provider: z
    .enum(["mock", "exa", "tavily", "brave", "serper", "custom"])
    .optional(),
});

export const SearchAgentInputSchema = z.object({
  requestId: z.string(),
  userId: z.string().optional(),
  businessProfile: BusinessProfileSchema,
  mission: MissionSchema,
  searchOptions: SearchOptionsSchema.optional(),
  providerOptions: ProviderOptionsSchema.optional(),
});

export const EmailContactSchema = z.object({
  value: z.string(),
  type: z.enum(["generic", "personal", "unknown"]),
  confidence: z.number(),
  sourceUrl: z.string().optional(),
});

export const PhoneContactSchema = z.object({
  value: z.string(),
  confidence: z.number(),
  sourceUrl: z.string().optional(),
});

export const SocialLinkSchema = z.object({
  platform: z.enum(["linkedin", "facebook", "instagram", "x", "other"]),
  url: z.string(),
});

export const ContactSchema = z.object({
  emails: z.array(EmailContactSchema),
  phones: z.array(PhoneContactSchema),
  contactPageUrl: z.string().optional(),
  socialLinks: z.array(SocialLinkSchema).optional(),
});

export const EvidenceSchema = z.object({
  sourceUrl: z.string(),
  title: z.string().optional(),
  snippet: z.string(),
  evidenceType: z.enum([
    "industry_match",
    "location_match",
    "service_match",
    "contact_found",
    "activity_signal",
    "bad_fit_signal",
    "other",
  ]),
  confidence: z.number(),
});

export const ScoresSchema = z.object({
  fitScore: z.number(),
  contactabilityScore: z.number(),
  evidenceQualityScore: z.number(),
  freshnessScore: z.number().optional(),
  overallScore: z.number(),
});

export const ClassificationSchema = z.object({
  category: z.enum([
    "high_fit",
    "promising_but_incomplete",
    "needs_verification",
    "rejected_or_low_fit",
  ]),
  confidence: z.enum(["low", "medium", "high"]),
  reasons: z.array(z.string()),
  missingInfo: z.array(z.string()),
  recommendedNextAction: z.enum([
    "open_details",
    "investigate_more",
    "draft_outreach",
    "find_contact",
    "reject",
    "save_for_later",
  ]),
});

export const CandidateLeadSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  name: z.string(),
  type: z.enum(["company", "person", "unknown"]),
  websiteUrl: z.string().optional(),
  domain: z.string().optional(),
  sourceUrls: z.array(z.string()),
  sourceProvider: z.string().optional(),
  sourceQuery: z.string().optional(),
  shortDescription: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  businessSizeEstimate: z.string().optional(),
  contact: ContactSchema,
  evidence: z.array(EvidenceSchema),
  scores: ScoresSchema,
  classification: ClassificationSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SearchPlanSchema = z.object({
  interpretedGoal: z.string(),
  targetPersonas: z.array(z.string()),
  targetSegments: z.array(z.string()),
  goodFitSignals: z.array(z.string()),
  badFitSignals: z.array(z.string()),
  suggestedSources: z.array(z.string()),
  generatedQueries: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export const SearchWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: z.enum(["info", "warning", "error"]),
  relatedLeadId: z.string().optional(),
});

export const SearchTraceEventSchema = z.object({
  timestamp: z.string(),
  step: z.string(),
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const SearchAgentOutputSchema = z.object({
  requestId: z.string(),
  missionId: z.string(),
  status: z.enum(["success", "partial_success", "failed"]),
  searchPlan: SearchPlanSchema,
  candidates: z.array(CandidateLeadSchema),
  groups: z.object({
    highFit: z.array(z.string()),
    promisingButIncomplete: z.array(z.string()),
    needsVerification: z.array(z.string()),
    rejectedOrLowFit: z.array(z.string()),
  }),
  summary: z.object({
    queriesRun: z.number(),
    rawResultsFound: z.number(),
    pagesFetched: z.number(),
    candidatesCreated: z.number(),
    duplicatesRemoved: z.number(),
    highFitCount: z.number(),
    warningCount: z.number(),
  }),
  warnings: z.array(SearchWarningSchema),
  trace: z.array(SearchTraceEventSchema),
});

export const DiscoverLeadCardVMSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  location: z.string().optional(),
  domain: z.string().optional(),
  contactBadges: z.array(z.string()),
  fitScore: z.number(),
  category: z.string(),
  reasons: z.array(z.string()),
  missingInfo: z.array(z.string()),
  recommendedNextAction: z.string(),
  primaryActionLabel: z.string(),
});

export type SearchAgentInput = z.infer<typeof SearchAgentInputSchema>;
export type SearchAgentOutput = z.infer<typeof SearchAgentOutputSchema>;
export type CandidateLead = z.infer<typeof CandidateLeadSchema>;
export type SearchPlan = z.infer<typeof SearchPlanSchema>;
export type SearchWarning = z.infer<typeof SearchWarningSchema>;
export type SearchTraceEvent = z.infer<typeof SearchTraceEventSchema>;
export type DiscoverLeadCardVM = z.infer<typeof DiscoverLeadCardVMSchema>;
export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;
export type Mission = z.infer<typeof MissionSchema>;
