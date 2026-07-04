import type { LeadVM } from '../leads/use-leads-api-queries';

export type FitCategory = 'high_fit' | 'promising' | 'needs_verification' | 'rejected';

export type ClusterMode = 'industry' | 'fit' | 'location';

export type DiscoverViewMode = 'list' | 'graph';

export const FIT_CATEGORY_LABELS: Record<FitCategory, string> = {
  high_fit: 'High fit',
  promising: 'Promising but incomplete',
  needs_verification: 'Needs verification',
  rejected: 'Rejected',
};

export const CLUSTER_MODE_LABELS: Record<ClusterMode, string> = {
  industry: 'Industry',
  fit: 'Fit tier',
  location: 'Location',
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

export function clusterKey(lead: LeadVM, mode: ClusterMode): string {
  switch (mode) {
    case 'industry':
      return lead.industry.trim() || 'Uncategorized';
    case 'fit':
      return FIT_CATEGORY_LABELS[leadFitCategory(lead)];
    case 'location': {
      const city = lead.location.split(',')[0]?.trim();
      return city || lead.location.trim() || 'Unknown location';
    }
  }
}

export function clusterColor(clusterId: string, mode: ClusterMode): string {
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

export function scoreNodeRadius(score: number): number {
  return 18 + (score / 100) * 10;
}
