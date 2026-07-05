import type { LeadVM } from '../leads/use-leads-api-queries';

export type FitCategory = 'high_fit' | 'promising' | 'needs_verification' | 'rejected';

export type ClusterMode = 'action' | 'location' | 'fit';

export type DiscoverViewMode = 'list' | 'map';

export type ActionSegmentId =
  | 'fast_wins'
  | 'high_fit_incomplete'
  | 'phone_first'
  | 'needs_enrichment'
  | 'promising_contactable'
  | 'needs_verification'
  | 'low_fit_noise';

export const FIT_CATEGORY_LABELS: Record<FitCategory, string> = {
  high_fit: 'High fit',
  promising: 'Promising but incomplete',
  needs_verification: 'Needs verification',
  rejected: 'Rejected',
};

export const CLUSTER_MODE_LABELS: Record<ClusterMode, string> = {
  action: 'Playbook',
  fit: 'Fit tier',
  location: 'Location',
};

export const ACTION_SEGMENT_META: Record<
  ActionSegmentId,
  {
    label: string;
    color: string;
    playbook: string;
    priority: number;
  }
> = {
  fast_wins: {
    label: 'Fast wins',
    color: 'var(--green)',
    playbook: 'Draft outreach now',
    priority: 1,
  },
  high_fit_incomplete: {
    label: 'High fit — missing contact',
    color: '#3d7a55',
    playbook: 'Enrich contacts first',
    priority: 2,
  },
  phone_first: {
    label: 'Phone-first targets',
    color: 'var(--orange)',
    playbook: 'Call or SMS playbook',
    priority: 3,
  },
  promising_contactable: {
    label: 'Promising & contactable',
    color: '#b45309',
    playbook: 'Qualify then outreach',
    priority: 4,
  },
  needs_enrichment: {
    label: 'Needs enrichment',
    color: 'var(--blue)',
    playbook: 'Find email or phone',
    priority: 5,
  },
  needs_verification: {
    label: 'Needs verification',
    color: '#64748b',
    playbook: 'Verify fit signals',
    priority: 6,
  },
  low_fit_noise: {
    label: 'Low fit — archive',
    color: 'var(--faint)',
    playbook: 'Review or reject',
    priority: 7,
  },
};

export function leadFitCategory(lead: LeadVM): FitCategory {
  if (lead.score >= 75) return 'high_fit';
  if (lead.score >= 60) return 'promising';
  if (lead.score >= 50) return 'needs_verification';
  return 'rejected';
}

export function filterLeadsByCategory(leads: LeadVM[], category: FitCategory): LeadVM[] {
  return leads.filter((lead) => leadFitCategory(lead) === category);
}

export function countByCategory(leads: LeadVM[]): Record<FitCategory, number> {
  return leads.reduce(
    (acc, lead) => {
      acc[leadFitCategory(lead)] += 1;
      return acc;
    },
    { high_fit: 0, promising: 0, needs_verification: 0, rejected: 0 },
  );
}

export function tabLabel(category: FitCategory, count: number): string {
  return `${FIT_CATEGORY_LABELS[category]} (${count})`;
}

export function deriveIndustry(lead: LeadVM): string {
  const fromField = lead.industry.trim();
  if (fromField) return fromField;

  const description = lead.description.trim();
  if (description) {
    const first = description.split(/[.,·–-]/)[0]?.trim();
    if (first && first.length <= 40) return first;
  }

  const city = lead.location.split(',')[0]?.trim();
  if (city) return `Local business · ${city}`;

  return 'Local business';
}

export function contactabilityScore(lead: LeadVM): number {
  let score = lead.contactability;
  if (lead.website.trim()) score += 15;
  return Math.min(100, score);
}

export function actionSegmentId(lead: LeadVM): ActionSegmentId {
  const fit = leadFitCategory(lead);
  const hasEmail = Boolean(lead.email.trim());
  const hasPhone = Boolean(lead.phone.trim());
  const hasContact = hasEmail || hasPhone;

  if (fit === 'rejected') return 'low_fit_noise';
  if (fit === 'high_fit' && hasContact) return 'fast_wins';
  if (fit === 'high_fit') return 'high_fit_incomplete';
  if ((fit === 'promising' || fit === 'needs_verification') && hasPhone && !hasEmail) {
    return 'phone_first';
  }
  if ((fit === 'promising' || fit === 'needs_verification') && !hasContact) {
    return 'needs_enrichment';
  }
  if (fit === 'promising' && hasContact) return 'promising_contactable';
  return 'needs_verification';
}

export function clusterKey(lead: LeadVM, mode: ClusterMode): string {
  switch (mode) {
    case 'action':
      return ACTION_SEGMENT_META[actionSegmentId(lead)].label;
    case 'fit':
      return FIT_CATEGORY_LABELS[leadFitCategory(lead)];
    case 'location': {
      const city = lead.location.split(',')[0]?.trim();
      return city || lead.location.trim() || 'Unknown location';
    }
  }
}

export function clusterColor(clusterId: string, mode: ClusterMode): string {
  if (mode === 'action') {
    const entry = Object.values(ACTION_SEGMENT_META).find((meta) => meta.label === clusterId);
    if (entry) return entry.color;
  }

  if (mode === 'fit') {
    if (clusterId.startsWith('High fit')) return 'var(--green)';
    if (clusterId.startsWith('Promising')) return 'var(--orange)';
    if (clusterId.startsWith('Needs verification')) return 'var(--blue)';
    return 'var(--faint)';
  }

  const palette = ['#4d7c5c', '#4a6278', '#6b5f7a', '#9a6b3c', '#57534e', '#5c6b7a'];
  const hash = [...clusterId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

export function topMissingGap(leads: LeadVM[]): string | null {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    for (const item of lead.missing) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

export function explainSegment(leads: LeadVM[], segmentId: ActionSegmentId): string {
  if (!leads.length) return '';

  const count = leads.length;
  const avgScore = Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / count);
  const withPhone = leads.filter((lead) => lead.phone.trim()).length;
  const withEmail = leads.filter((lead) => lead.email.trim()).length;
  const topGap = topMissingGap(leads);
  const city =
    [...new Set(leads.map((lead) => lead.location.split(',')[0]?.trim()).filter(Boolean))][0] ??
    'your target area';

  switch (segmentId) {
    case 'fast_wins':
      return `${count} high-fit lead${count === 1 ? '' : 's'} in ${city} with visible contact info (avg score ${avgScore}). Best candidates for immediate outreach.`;
    case 'high_fit_incomplete':
      return `${count} strong-fit account${count === 1 ? '' : 's'} missing public email or phone${topGap ? ` — mostly "${topGap}"` : ''}. Enrich before outreach.`;
    case 'phone_first':
      return `${count} lead${count === 1 ? '' : 's'} with phone numbers but no email — ideal for phone-first sequences in ${city}.`;
    case 'promising_contactable':
      return `${count} promising lead${count === 1 ? '' : 's'} with contact paths (${withEmail} email, ${withPhone} phone). Qualify fit signals before scaling outreach.`;
    case 'needs_enrichment':
      return `${count} lead${count === 1 ? '' : 's'} need contact enrichment${topGap ? ` — top gap: ${topGap}` : ''} before any outreach is worth the effort.`;
    case 'needs_verification':
      return `${count} lead${count === 1 ? '' : 's'} with moderate scores — verify ICP fit and buying signals before investing time.`;
    case 'low_fit_noise':
      return `${count} low-fit record${count === 1 ? '' : 's'} — review rejection reasons and archive to keep the pipeline clean.`;
  }
}

export function scoreNodeRadius(score: number): number {
  return 10 + (score / 100) * 8;
}
