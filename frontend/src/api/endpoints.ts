import { apiClient } from '../lib/api';
import { mapDashboard, mapInsights, mapLead, mapMission } from './mappers';
import type { DashboardDTO, InsightsDTO, LeadDTO, MissionCreatePayload, MissionDTO } from './types';
import type { DashboardVM, InsightsVM, LeadVM, MissionVM } from './models';

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardVM> {
  const { data } = await apiClient.get<DashboardDTO>('/home/dashboard', { signal });
  return mapDashboard(data);
}

export async function fetchMissions(signal?: AbortSignal): Promise<MissionVM[]> {
  const { data } = await apiClient.get<MissionDTO[]>('/missions', { signal });
  return data.map(mapMission);
}

export async function createMission(payload: MissionCreatePayload): Promise<MissionVM> {
  const { data } = await apiClient.post<MissionDTO>('/missions', payload);
  return mapMission(data);
}

export async function fetchLeads(
  params: { missionId?: number; category?: string } = {},
  signal?: AbortSignal,
): Promise<LeadVM[]> {
  const { data } = await apiClient.get<LeadDTO[]>('/leads', {
    params: {
      mission_id: params.missionId,
      category: params.category,
    },
    signal,
  });
  return data.map(mapLead);
}

export async function fetchLead(slug: string, signal?: AbortSignal): Promise<LeadVM> {
  const { data } = await apiClient.get<LeadDTO>(`/leads/${slug}`, { signal });
  return mapLead(data);
}

export async function fetchInsights(missionId?: number, signal?: AbortSignal): Promise<InsightsVM> {
  const { data } = await apiClient.get<InsightsDTO>('/insights', {
    params: { mission_id: missionId },
    signal,
  });
  return mapInsights(data);
}
