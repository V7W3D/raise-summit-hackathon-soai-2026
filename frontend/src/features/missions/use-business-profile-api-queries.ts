import axios from 'axios';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';

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
  }));

export type BusinessProfileVM = z.infer<typeof businessProfileSchema>;

export const businessProfileQueryKey = ['business-profile'] as const;

async function fetchBusinessProfile(signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/business-profile`, { signal });
  return businessProfileSchema.parse(data);
}

export function useBusinessProfile() {
  return useQuery({
    queryKey: businessProfileQueryKey,
    queryFn: ({ signal }) => fetchBusinessProfile(signal),
  });
}
