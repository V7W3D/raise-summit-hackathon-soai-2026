import axios from 'axios';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';
import { dashboardQueryKey } from '../home/use-home-api-queries';
import { enrichLeadContent } from './lead-content';
import { enrichLeadDisplay } from './lead-display';

export const leadStatuses = ['new', 'approved', 'rejected'] as const;
export const trackingStatuses = [
  'to_contact',
  'contacted',
  'replied',
  'engaged',
  'won',
  'lost',
] as const;

export type LeadStatus = (typeof leadStatuses)[number];
export type TrackingStatus = (typeof trackingStatuses)[number];

const evidenceSchema = z.object({
  quote: z.string(),
  source: z.string(),
});

const sourceScannedSchema = z.object({
  label: z.string(),
  time: z.string(),
});

export const leadSchema = z
  .object({
    id: z.number(),
    mission_id: z.number(),
    name: z.string(),
    description: z.string(),
    location: z.string(),
    website: z.string(),
    email: z.string(),
    phone: z.string(),
    score: z.number(),
    status: z.enum(leadStatuses).default('new'),
    tracking_status: z.enum(trackingStatuses).default('to_contact'),
    why: z.array(z.string()),
    missing: z.array(z.string()),
    recommended: z.array(z.string()),
    evidence: z.array(evidenceSchema),
    sources_scanned: z.array(sourceScannedSchema),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform((dto) =>
    enrichLeadContent(
      enrichLeadDisplay({
        id: dto.id,
        missionId: dto.mission_id,
        name: dto.name,
        description: dto.description,
        location: dto.location,
        website: dto.website,
        email: dto.email,
        phone: dto.phone,
        score: dto.score,
        status: dto.status,
        trackingStatus: dto.tracking_status,
        why: dto.why,
        missing: dto.missing,
        recommended: dto.recommended,
        evidence: dto.evidence,
        sourcesScanned: dto.sources_scanned,
      }),
    ),
  );

export type LeadVM = z.infer<typeof leadSchema>;

export const leadQueryKey = (id: number) => ['lead', id] as const;

async function fetchLead(id: number, signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/leads/${id}`, { signal });
  return leadSchema.parse(data);
}

export function useLead(leadId: string | undefined) {
  const id = leadId ? Number(leadId) : undefined;
  return useQuery({
    queryKey: leadQueryKey(id ?? 0),
    queryFn: ({ signal }) => fetchLead(id as number, signal),
    enabled: id !== undefined && !Number.isNaN(id),
  });
}

async function updateLeadStatus(id: number, status: LeadStatus) {
  const { data } = await axios.patch(`${API_BASE_URL}/leads/${id}`, { status });
  return leadSchema.parse(data);
}

async function updateLeadTrackingStatus(id: number, trackingStatus: TrackingStatus) {
  const { data } = await axios.patch(`${API_BASE_URL}/leads/${id}`, {
    tracking_status: trackingStatus,
  });
  return leadSchema.parse(data);
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeadStatus }) =>
      updateLeadStatus(id, status),
    onSuccess: (lead) => {
      queryClient.setQueryData(leadQueryKey(lead.id), lead);
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}

export function useUpdateLeadTrackingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trackingStatus }: { id: number; trackingStatus: TrackingStatus }) =>
      updateLeadTrackingStatus(id, trackingStatus),
    onSuccess: (lead) => {
      queryClient.setQueryData(leadQueryKey(lead.id), lead);
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
