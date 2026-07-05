import type { BusinessProfileVM } from './use-business-profile-api-queries';
import type { MissionFormState } from './mission-constants';
import type { MissionCreatePayload } from './use-missions-api-queries';

const FRENCH_LOCATION_HINTS = [
  'france',
  'lyon',
  'paris',
  'marseille',
  'toulouse',
  'bordeaux',
  'lille',
  'nantes',
  'strasbourg',
  'french',
  'français',
];

export function inferLanguageFromLocation(
  location: string,
  profileLanguages?: string[],
): string {
  const lower = location.toLowerCase();
  if (FRENCH_LOCATION_HINTS.some((hint) => lower.includes(hint))) {
    return 'fr';
  }
  return profileLanguages?.[0] ?? 'en';
}

export function defaultLocationFromProfile(profile: BusinessProfileVM): string {
  const geo = profile.targetGeographies[0];
  if (!geo) return '';
  if (geo.toLowerCase() === 'france') return 'Lyon, France';
  return geo;
}

export function toggleChipSelection(current: string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

export function resolveLeadCount(form: MissionFormState): number {
  if (form.customLeadCount.trim()) {
    const parsed = Number.parseInt(form.customLeadCount, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) return parsed;
  }
  return form.desiredLeadCount;
}

export function buildCreatePayload(form: MissionFormState): MissionCreatePayload | null {
  const target = form.target.trim();
  const location = form.location.trim();
  if (!target || !location) return null;

  const leadCount = resolveLeadCount(form);
  const name = form.name.trim();
  if (!name) return null;

  const payload: MissionCreatePayload = {
    name,
    target,
    location,
    target_industry: target,
    desired_lead_count: leadCount,
    language: form.language || undefined,
    target_business_size: form.targetBusinessSize || undefined,
  };

  if (form.missionPriority) payload.mission_priority = form.missionPriority;
  if (form.outreachChannel) payload.outreach_channel = form.outreachChannel;
  if (form.negativeFilters.length) payload.negative_filters = form.negativeFilters;

  return payload;
}

export function formToPreviewPayload(form: MissionFormState) {
  return {
    target: form.target.trim(),
    location: form.location.trim(),
    target_business_size: form.targetBusinessSize || null,
    desired_lead_count: resolveLeadCount(form),
    mission_priority: form.missionPriority || null,
    negative_filters: form.negativeFilters,
    outreach_channel: form.outreachChannel || null,
    name: form.name.trim(),
  };
}

export function mergeCustomTarget(relatedTargets: string[], customTarget: string): string[] {
  const trimmed = customTarget.trim();
  if (!trimmed) return relatedTargets;
  if (relatedTargets.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
    return relatedTargets;
  }
  return [...relatedTargets, trimmed];
}

export function addTargetKeyword(keywords: string[], raw: string): string[] {
  const word = raw.trim().split(/\s+/)[0] ?? '';
  if (!word) return keywords;
  const normalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  if (keywords.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
    return keywords;
  }
  return [...keywords, normalized];
}

export function removeTargetKeyword(keywords: string[], keyword: string): string[] {
  return keywords.filter((item) => item.toLowerCase() !== keyword.toLowerCase());
}

export function canAdvanceFromStep(step: string, form: MissionFormState): boolean {
  switch (step) {
    case 'what':
      return Boolean(form.target.trim() && form.location.trim());
    case 'priority':
      return Boolean(form.missionPriority);
    case 'goal':
      return resolveLeadCount(form) >= 1;
    case 'review':
      return Boolean(form.name.trim());
    default:
      return false;
  }
}
