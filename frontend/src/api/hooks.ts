import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMission,
  fetchDashboard,
  fetchInsights,
  fetchLead,
  fetchLeads,
  fetchMissions,
} from './endpoints';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  missions: ['missions'] as const,
  leads: (missionId?: number, category?: string) => ['leads', { missionId, category }] as const,
  lead: (slug: string) => ['lead', slug] as const,
  insights: (missionId?: number) => ['insights', { missionId }] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => fetchDashboard(signal),
  });
}

export function useMissions() {
  return useQuery({
    queryKey: queryKeys.missions,
    queryFn: ({ signal }) => fetchMissions(signal),
  });
}

export function useLeads(params: { missionId?: number; category?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.leads(params.missionId, params.category),
    queryFn: ({ signal }) => fetchLeads(params, signal),
  });
}

export function useLead(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.lead(slug ?? ''),
    queryFn: ({ signal }) => fetchLead(slug as string, signal),
    enabled: Boolean(slug),
  });
}

export function useInsights(missionId?: number) {
  return useQuery({
    queryKey: queryKeys.insights(missionId),
    queryFn: ({ signal }) => fetchInsights(missionId, signal),
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.missions });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
