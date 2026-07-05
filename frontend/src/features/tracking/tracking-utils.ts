import type { LeadVM, TrackingStatus } from '../leads/use-leads-api-queries';

export const TRACKING_COLUMNS: TrackingStatus[] = [
  'to_contact',
  'contacted',
  'replied',
  'engaged',
  'won',
  'lost',
];

export const trackingColumnMeta: Record<
  TrackingStatus,
  { label: string; hint: string; tone: 'neutral' | 'blue' | 'green' | 'orange' | 'red' }
> = {
  to_contact: {
    label: 'To contact',
    hint: 'Approved leads ready for first outreach',
    tone: 'neutral',
  },
  contacted: {
    label: 'Contacted',
    hint: 'Outreach sent, awaiting a response',
    tone: 'blue',
  },
  replied: {
    label: 'Replied',
    hint: 'Lead answered your first outreach',
    tone: 'orange',
  },
  engaged: {
    label: 'Engaged',
    hint: 'Active conversation or meeting planned',
    tone: 'green',
  },
  won: {
    label: 'Won',
    hint: 'Converted or deal closed',
    tone: 'green',
  },
  lost: {
    label: 'Lost',
    hint: 'No response or declined',
    tone: 'red',
  },
};

export function filterTrackingLeads(leads: LeadVM[]): LeadVM[] {
  return leads.filter((lead) => lead.status === 'approved');
}

export function groupLeadsByTrackingStatus(
  leads: LeadVM[],
): Record<TrackingStatus, LeadVM[]> {
  const grouped = Object.fromEntries(
    TRACKING_COLUMNS.map((status) => [status, [] as LeadVM[]]),
  ) as Record<TrackingStatus, LeadVM[]>;

  for (const lead of leads) {
    const status = TRACKING_COLUMNS.includes(lead.trackingStatus)
      ? lead.trackingStatus
      : 'to_contact';
    grouped[status].push(lead);
  }

  for (const status of TRACKING_COLUMNS) {
    grouped[status].sort((a, b) => b.score - a.score);
  }

  return grouped;
}

export function countByTrackingStatus(leads: LeadVM[]): Record<TrackingStatus, number> {
  const grouped = groupLeadsByTrackingStatus(leads);
  return Object.fromEntries(
    TRACKING_COLUMNS.map((status) => [status, grouped[status].length]),
  ) as Record<TrackingStatus, number>;
}
