import axios from 'axios';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';
import { enrichLeadContent } from './lead-content';
import { enrichLeadDisplay } from './lead-display';

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
