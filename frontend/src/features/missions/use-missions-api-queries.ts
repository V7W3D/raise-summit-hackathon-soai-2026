import axios from 'axios';
import { z } from 'zod';
import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';
import { dashboardQueryKey } from '../home/use-home-api-queries';

export const missionSearchStatuses = ['running', 'ready', 'failed'] as const;

export type MissionSearchStatus = (typeof missionSearchStatuses)[number];

export const missionUrgencies = ['low', 'medium', 'high'] as const;

export type MissionUrgency = (typeof missionUrgencies)[number];

const missionSchema = z
  .object({
    id: z.number(),
    search_status: z.enum(missionSearchStatuses),
    search_activated: z.boolean(),
    name: z.string(),
    target: z.string(),
    location: z.string(),
    progress: z.number(),
    is_archived: z.boolean(),
    description: z.string(),
    target_industry: z.string().nullable(),
    target_business_size: z.string().nullable(),
    desired_lead_count: z.number().nullable(),
    urgency: z.enum(missionUrgencies).nullable(),
    language: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    last_activity_at: z.string(),
  })
  .transform((dto) => ({
    id: dto.id,
    searchStatus: dto.search_status,
    searchActivated: dto.search_activated,
    name: dto.name,
    target: dto.target,
    location: dto.location,
    progress: dto.progress,
    isArchived: dto.is_archived,
    description: dto.description,
    targetIndustry: dto.target_industry,
    targetBusinessSize: dto.target_business_size,
    desiredLeadCount: dto.desired_lead_count,
    urgency: dto.urgency,
    language: dto.language,
  }));

export type MissionVM = z.infer<typeof missionSchema>;

const SEARCH_POLL_INTERVAL_MS = 2_000;

function missionListHasRunningSearch(missions: MissionVM[] | undefined) {
  return missions?.some((mission) => mission.searchStatus === 'running') ?? false;
}

function missionIsSearchRunning(mission: MissionVM | undefined) {
  return mission?.searchStatus === 'running';
}

function useRefetchWhenSearchCompletes(
  searchStatuses: MissionSearchStatus[] | undefined,
) {
  const queryClient = useQueryClient();
  const wasRunningRef = useRef(false);

  useEffect(() => {
    const isRunning = searchStatuses?.some((status) => status === 'running') ?? false;
    if (wasRunningRef.current && !isRunning) {
      void queryClient.invalidateQueries({ queryKey: ['missions'] });
      void queryClient.invalidateQueries({ queryKey: ['mission'] });
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    }
    wasRunningRef.current = isRunning;
  }, [queryClient, searchStatuses]);
}

export const missionsQueryKey = (isArchived = false) => ['missions', { isArchived }] as const;

export const missionQueryKey = (id: number) => ['mission', id] as const;

export type MissionCreatePayload = {
  name: string;
  target?: string;
  location?: string;
  description?: string;
  target_industry?: string;
  target_business_size?: string;
  desired_lead_count?: number;
  urgency?: MissionUrgency;
  language?: string;
};

export type MissionUpdatePayload = {
  is_archived?: boolean;
  progress?: number;
};

async function fetchMissions(isArchived: boolean, signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/missions`, {
    params: { is_archived: isArchived },
    signal,
  });
  return z.array(missionSchema).parse(data);
}

async function fetchMission(id: number, signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/missions/${id}`, { signal });
  return missionSchema.parse(data);
}

async function createMission(payload: MissionCreatePayload) {
  const { data } = await axios.post(`${API_BASE_URL}/missions`, payload);
  return missionSchema.parse(data);
}

async function updateMission(id: number, payload: MissionUpdatePayload) {
  const { data } = await axios.patch(`${API_BASE_URL}/missions/${id}`, payload);
  return missionSchema.parse(data);
}

async function deleteMission(id: number) {
  await axios.delete(`${API_BASE_URL}/missions/${id}`);
}

export function useMissions(options: { isArchived?: boolean; enabled?: boolean } = {}) {
  const isArchived = options.isArchived ?? false;
  const query = useQuery({
    queryKey: missionsQueryKey(isArchived),
    queryFn: ({ signal }) => fetchMissions(isArchived, signal),
    enabled: options.enabled ?? true,
    refetchInterval: (query) =>
      missionListHasRunningSearch(query.state.data) ? SEARCH_POLL_INTERVAL_MS : false,
  });

  useRefetchWhenSearchCompletes(query.data?.map((mission) => mission.searchStatus));

  return query;
}

export function useMission(id: number) {
  const query = useQuery({
    queryKey: missionQueryKey(id),
    queryFn: ({ signal }) => fetchMission(id, signal),
    enabled: !Number.isNaN(id),
    refetchInterval: (query) =>
      missionIsSearchRunning(query.state.data) ? SEARCH_POLL_INTERVAL_MS : false,
  });

  useRefetchWhenSearchCompletes(
    query.data ? [query.data.searchStatus] : undefined,
  );

  return query;
}

async function runMissionSearch(id: number) {
  const { data } = await axios.post(`${API_BASE_URL}/missions/${id}/search`);
  return missionSchema.parse(data);
}

export function useRunMissionSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runMissionSearch,
    onSuccess: (_mission, missionId) => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: missionQueryKey(missionId) });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MissionUpdatePayload }) =>
      updateMission(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}

export function useDeleteMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
