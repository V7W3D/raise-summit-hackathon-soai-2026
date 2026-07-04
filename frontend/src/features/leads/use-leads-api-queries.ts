import axios from 'axios';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';

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
    slug: z.string(),
    mission_id: z.number(),
    name: z.string(),
    description: z.string(),
    location: z.string(),
    website: z.string(),
    email: z.string(),
    phone: z.string(),
    initials: z.string(),
    logo_color: z.string(),
    contact_badge: z.string(),
    score: z.number(),
    score_label: z.string(),
    score_tone: z.enum(['green', 'blue', 'orange']),
    contactability: z.number(),
    confidence: z.string(),
    status: z.string(),
    category: z.string(),
    industry: z.string(),
    employees: z.string(),
    service_area: z.string(),
    business_type: z.string(),
    why: z.array(z.string()),
    missing: z.array(z.string()),
    recommended: z.array(z.string()),
    evidence: z.array(evidenceSchema),
    sources_scanned: z.array(sourceScannedSchema),
    ai_summary: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform((dto) => ({
    id: dto.slug,
    numericId: dto.id,
    missionId: dto.mission_id,
    initials: dto.initials || dto.name.slice(0, 2).toUpperCase(),
    logoColor: dto.logo_color,
    name: dto.name,
    description: dto.description,
    location: dto.location,
    website: dto.website,
    email: dto.email,
    phone: dto.phone,
    contactBadge: dto.contact_badge,
    score: dto.score,
    scoreLabel: dto.score_label,
    scoreTone: dto.score_tone,
    contactability: dto.contactability,
    confidence: dto.confidence,
    status: dto.status,
    category: dto.category,
    industry: dto.industry,
    employees: dto.employees,
    serviceArea: dto.service_area,
    businessType: dto.business_type,
    why: dto.why,
    missing: dto.missing,
    recommended: dto.recommended,
    evidence: dto.evidence,
    sourcesScanned: dto.sources_scanned,
    aiSummary: dto.ai_summary,
  }));

export type LeadVM = z.infer<typeof leadSchema>;

export const leadQueryKey = (slug: string) => ['lead', slug] as const;

async function fetchLead(slug: string, signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/leads/${slug}`, { signal });
  return leadSchema.parse(data);
}

export function useLead(slug: string | undefined) {
  return useQuery({
    queryKey: leadQueryKey(slug ?? ''),
    queryFn: ({ signal }) => fetchLead(slug as string, signal),
    enabled: Boolean(slug),
  });
}
