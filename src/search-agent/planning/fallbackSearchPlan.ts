import type { BusinessProfile, Mission, SearchPlan } from "../schemas";
import type { MissionUnderstanding } from "../types";

export function buildMissionUnderstanding(
  businessProfile: BusinessProfile,
  mission: Mission,
): MissionUnderstanding {
  const language =
    mission.language ??
    businessProfile.languages?.[0] ??
    (businessProfile.targetGeographies?.some((g) =>
      g.toLowerCase().includes("france"),
    )
      ? "fr"
      : "en");

  const isFrench =
    language.toLowerCase().startsWith("fr") ||
    businessProfile.targetGeographies?.some((g) =>
      g.toLowerCase().includes("france"),
    ) === true;

  return {
    goalType: mission.goalType,
    description: mission.description,
    targetLocation: mission.targetLocation,
    targetIndustry: mission.targetIndustry,
    language,
    isFrench,
    businessContext: `${businessProfile.businessName} sells: ${businessProfile.whatWeSell}. Value: ${businessProfile.valueProposition ?? "not specified"}`,
  };
}

export function generateFallbackSearchPlan(
  businessProfile: BusinessProfile,
  mission: Mission,
  understanding: MissionUnderstanding,
  maxQueries = 6,
): SearchPlan {
  const location =
    mission.targetLocation ??
    businessProfile.targetGeographies?.[0] ??
    "local area";
  const industry =
    mission.targetIndustry ??
    inferIndustryFromMission(mission.description) ??
    "target businesses";

  const base = buildGoalSpecificPlan(
    mission.goalType,
    industry,
    location,
    understanding,
    businessProfile,
  );

  const queries = generateQueries(
    mission,
    businessProfile,
    understanding,
    industry,
    location,
    maxQueries,
  );

  return {
    ...base,
    interpretedGoal: `Find ${industry} in ${location} aligned with: ${mission.description}`,
    generatedQueries: queries,
    assumptions: [
      `Searching public web sources for ${industry} in ${location}`,
      understanding.isFrench
        ? "Including French-language queries for local discovery"
        : "Using English-language queries",
      "Contact pages and business websites prioritized over social profiles",
    ],
  };
}

function inferIndustryFromMission(description: string): string | undefined {
  const lower = description.toLowerCase();
  const sectors = [
    "construction",
    "plumbing",
    "plombier",
    "renovation",
    "electrician",
    "hvac",
    "roofing",
  ];
  return sectors.find((s) => lower.includes(s));
}

function buildGoalSpecificPlan(
  goalType: Mission["goalType"],
  industry: string,
  location: string,
  understanding: MissionUnderstanding,
  businessProfile: BusinessProfile,
): Omit<SearchPlan, "interpretedGoal" | "generatedQueries" | "assumptions"> {
  switch (goalType) {
    case "find_clients":
      return {
        targetPersonas: [
          "owner",
          "founder",
          "operations manager",
          "office manager",
          "director",
        ],
        targetSegments: expandClientSegments(industry, understanding),
        goodFitSignals: [
          "local service business",
          "phone-first workflow",
          "emergency service",
          "active website",
          "small team",
          ...(understanding.isFrench ? ["devis gratuit", "intervention rapide"] : []),
        ],
        badFitSignals: [
          "large enterprise",
          "national group",
          "no phone workflow",
          "inactive website",
          "public tenders only",
          ...(understanding.isFrench
            ? ["grand groupe", "grands comptes", "groupe national", "appels d'offres"]
            : []),
          ...(businessProfile.badFitCustomers ?? []),
        ],
        suggestedSources: ["web", "directories", "maps"],
      };
    case "find_suppliers":
      return {
        targetPersonas: ["sales manager", "supplier manager", "distributor", "owner"],
        targetSegments: [`${industry} suppliers`, `B2B distributors in ${location}`],
        goodFitSignals: [
          "product availability",
          "delivery zone",
          "B2B",
          "certifications",
          "minimum order",
          "active website",
        ],
        badFitSignals: ["consumer-only", "no B2B contact", "inactive catalog"],
        suggestedSources: ["web", "directories"],
      };
    case "find_consultants":
      return {
        targetPersonas: [
          "independent consultant",
          "agency owner",
          "expert",
          "partner",
        ],
        targetSegments: [`${industry} consultants`, `agencies in ${location}`],
        goodFitSignals: [
          "case studies",
          "service pages",
          "testimonials",
          "clear expertise",
        ],
        badFitSignals: ["no portfolio", "generic agency", "unrelated services"],
        suggestedSources: ["web", "linkedin_public"],
      };
    case "find_partners":
      return {
        targetPersonas: ["business development", "partnership manager", "founder"],
        targetSegments: [`potential partners in ${industry}`, location],
        goodFitSignals: ["complementary services", "local presence", "active outreach"],
        badFitSignals: ["direct competitor", "no partnership signals"],
        suggestedSources: ["web", "directories"],
      };
    case "find_investors":
      return {
        targetPersonas: ["partner", "analyst", "principal", "angel"],
        targetSegments: ["sector-focused investors", "regional angels"],
        goodFitSignals: [
          "sector thesis",
          "region match",
          "stage fit",
          "portfolio overlap",
        ],
        badFitSignals: ["wrong stage", "wrong sector", "no public contact"],
        suggestedSources: ["web", "linkedin_public"],
      };
    case "find_hires":
      return {
        targetPersonas: ["professional", "team lead"],
        targetSegments: ["public company pages only"],
        goodFitSignals: ["public team page", "company about page"],
        badFitSignals: ["job platform scraping", "private profiles"],
        suggestedSources: ["web", "linkedin_public"],
      };
  }
}

function expandClientSegments(
  industry: string,
  understanding: MissionUnderstanding,
): string[] {
  const lower = industry.toLowerCase();
  const segments = [industry];

  if (
    lower.includes("construction") ||
    lower.includes("plomb") ||
    understanding.description.toLowerCase().includes("construction")
  ) {
    segments.push(
      "plumbers",
      "roofers",
      "renovation companies",
      "electricians",
      "HVAC businesses",
      "emergency repair services",
    );
  }

  return [...new Set(segments)];
}

export function generateQueries(
  mission: Mission,
  businessProfile: BusinessProfile,
  understanding: MissionUnderstanding,
  industry: string,
  location: string,
  maxQueries: number,
): string[] {
  const queries: string[] = [];
  const isFr = understanding.isFrench;

  if (mission.goalType === "find_clients") {
    if (isFr) {
      queries.push(
        `plombier ${location} urgence contact`,
        `entreprise rénovation ${location} téléphone`,
        `BTP ${location} service local contact`,
        `${industry} ${location} devis email`,
        `artisan ${location} dépannage contact`,
        `entreprise ${industry} ${location} site web`,
      );
    } else {
      queries.push(
        `${industry} ${location} contact email`,
        `${industry} ${location} phone number`,
        `local ${industry} ${location} services`,
        `${industry} ${location} emergency contact`,
        `small business ${industry} ${location}`,
      );
    }
  } else if (mission.goalType === "find_suppliers") {
    queries.push(
      `${industry} supplier ${location} B2B contact`,
      `wholesale ${industry} ${location} email`,
      `distributor ${industry} ${location}`,
    );
  } else if (mission.goalType === "find_consultants") {
    queries.push(
      `${industry} consultant ${location} portfolio`,
      `${industry} agency ${location} case studies`,
    );
  } else if (mission.goalType === "find_investors") {
    queries.push(
      `${businessProfile.businessType ?? "startup"} investor ${location}`,
      `angel investor ${industry} ${location}`,
    );
  } else if (mission.goalType === "find_hires") {
    queries.push(
      `${industry} company ${location} team about`,
      `${industry} ${location} company website team page`,
    );
  } else {
    queries.push(`${industry} ${location} contact`, `${industry} partner ${location}`);
  }

  if (businessProfile.idealCustomers?.length) {
    for (const ideal of businessProfile.idealCustomers.slice(0, 2)) {
      queries.push(`${ideal} ${location} contact`);
    }
  }

  return [...new Set(queries)].slice(0, maxQueries);
}
