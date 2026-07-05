import axios from 'axios';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';
import { dashboardQueryKey } from '../home/use-home-api-queries';
import { leadSchema } from '../leads/use-leads-api-queries';

export const leadsQueryKey = (missionId?: number) => ['leads', { missionId }] as const;

async function fetchLeads(params: { missionId?: number } = {}, signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/leads`, {
    params: {
      mission_id: params.missionId,
    },
    signal,
  });
  return z.array(leadSchema).parse(data);
}

export function useLeads(
  params: { missionId?: number; refetchInterval?: number | false } = {},
) {
  return useQuery({
    queryKey: leadsQueryKey(params.missionId),
    queryFn: ({ signal }) => fetchLeads(params, signal),
    refetchInterval: params.refetchInterval,
  });
}

const runSearchResultSchema = z.object({
  missionId: z.number(),
  agentStatus: z.string(),
  leadsCreated: z.number(),
});

async function runMissionSearch(missionId: number) {
  const { data } = await axios.post(`${API_BASE_URL}/missions/${missionId}/search`);
  return runSearchResultSchema.parse(data);
}

export function useRunMissionSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runMissionSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}
