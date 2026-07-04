import axios from 'axios';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';
import { leadSchema } from '../leads/use-leads-api-queries';

export const leadsQueryKey = (missionId?: number, category?: string) =>
  ['leads', { missionId, category }] as const;

async function fetchLeads(
  params: { missionId?: number; category?: string } = {},
  signal?: AbortSignal,
) {
  const { data } = await axios.get(`${API_BASE_URL}/leads`, {
    params: {
      mission_id: params.missionId,
      category: params.category,
    },
    signal,
  });
  return z.array(leadSchema).parse(data);
}

export function useLeads(params: { missionId?: number; category?: string } = {}) {
  return useQuery({
    queryKey: leadsQueryKey(params.missionId, params.category),
    queryFn: ({ signal }) => fetchLeads(params, signal),
  });
}
