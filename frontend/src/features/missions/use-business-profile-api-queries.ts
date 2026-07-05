import axios from 'axios';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';
import { prospectSegmentsQueryKey } from './use-missions-api-queries';

const businessProfileSchema = z
  .object({
    id: z.number(),
    user_id: z.number(),
    business_name: z.string(),
    business_type: z.string().nullable(),
    description: z.string().nullable(),
    what_we_sell: z.string(),
    value_proposition: z.string().nullable(),
    target_geographies: z.array(z.string()),
    ideal_customers: z.array(z.string()),
    bad_fit_customers: z.array(z.string()),
    preferred_tone: z.string().nullable(),
    languages: z.array(z.string()),
    created_at: z.string(),
    updated_at: z.string(),
    website: z.string().nullable().optional(),
    is_network_member: z.boolean().default(false),
    network_badge: z.enum(['verified', 'sponsored']).nullable().optional(),
  })
  .transform((dto) => ({
    id: dto.id,
    userId: dto.user_id,
    businessName: dto.business_name,
    businessType: dto.business_type,
    description: dto.description,
    whatWeSell: dto.what_we_sell,
    valueProposition: dto.value_proposition,
    targetGeographies: dto.target_geographies,
    idealCustomers: dto.ideal_customers,
    badFitCustomers: dto.bad_fit_customers,
    preferredTone: dto.preferred_tone,
    languages: dto.languages,
    updatedAt: dto.updated_at,
    website: dto.website ?? null,
    isNetworkMember: dto.is_network_member,
    networkBadge: dto.network_badge ?? null,
  }));

export type BusinessProfileVM = z.infer<typeof businessProfileSchema>;

export const businessProfileQueryKey = ['business-profile'] as const;

async function fetchBusinessProfile(signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/business-profile`, { signal });
  return businessProfileSchema.parse(data);
}

export type BusinessProfileUpdatePayload = {
  business_name?: string;
  business_type?: string | null;
  description?: string | null;
  what_we_sell?: string;
  value_proposition?: string | null;
  target_geographies?: string[];
  ideal_customers?: string[];
  bad_fit_customers?: string[];
  preferred_tone?: string | null;
  languages?: string[];
  website?: string | null;
};

async function updateBusinessProfile(payload: BusinessProfileUpdatePayload) {
  const { data } = await axios.patch(`${API_BASE_URL}/business-profile`, payload);
  return businessProfileSchema.parse(data);
}

export function useBusinessProfile() {
  return useQuery({
    queryKey: businessProfileQueryKey,
    queryFn: ({ signal }) => fetchBusinessProfile(signal),
  });
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBusinessProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: businessProfileQueryKey });
      void queryClient.invalidateQueries({ queryKey: prospectSegmentsQueryKey });
    },
  });
}
