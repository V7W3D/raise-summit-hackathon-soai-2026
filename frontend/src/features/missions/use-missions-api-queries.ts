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

export const missionPriorities = ['fast_wins', 'high_value', 'broad_coverage'] as const;

export type MissionPriority = (typeof missionPriorities)[number];

export const outreachChannels = ['email', 'phone', 'linkedin', 'mixed'] as const;

export type OutreachChannel = (typeof outreachChannels)[number];

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
    mission_priority: z.enum(missionPriorities).nullable(),
    outreach_channel: z.enum(outreachChannels).nullable(),
    buyer_roles: z.array(z.string()).default([]),
    trigger_signals: z.array(z.string()).default([]),
    must_have_filters: z.array(z.string()).default([]),
    nice_to_have_filters: z.array(z.string()).default([]),
    negative_filters: z.array(z.string()).default([]),
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
    missionPriority: dto.mission_priority,
    outreachChannel: dto.outreach_channel,
    buyerRoles: dto.buyer_roles,
    triggerSignals: dto.trigger_signals,
    mustHaveFilters: dto.must_have_filters,
    niceToHaveFilters: dto.nice_to_have_filters,
    negativeFilters: dto.negative_filters,
  }));

export type MissionVM = z.infer<typeof missionSchema>;

const SEARCH_POLL_INTERVAL_MS = 2_000;
export const SEARCH_UI_TIMEOUT_MS = 90 * 1000;

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
  mission_priority?: MissionPriority;
  outreach_channel?: OutreachChannel;
  buyer_roles?: string[];
  trigger_signals?: string[];
  must_have_filters?: string[];
  nice_to_have_filters?: string[];
  negative_filters?: string[];
};

export type MissionUpdatePayload = {
  name?: string;
  target?: string;
  location?: string;
  description?: string;
  target_industry?: string | null;
  target_business_size?: string | null;
  desired_lead_count?: number | null;
  urgency?: MissionUrgency | null;
  language?: string | null;
  mission_priority?: MissionPriority | null;
  outreach_channel?: OutreachChannel | null;
  buyer_roles?: string[];
  trigger_signals?: string[];
  must_have_filters?: string[];
  nice_to_have_filters?: string[];
  negative_filters?: string[];
  is_archived?: boolean;
  progress?: number;
};

export type MissionPreviewPayload = {
  target?: string;
  location?: string;
  target_business_size?: string | null;
  desired_lead_count?: number;
  mission_priority?: MissionPriority | null;
  buyer_roles?: string[];
  trigger_signals?: string[];
  must_have_filters?: string[];
  nice_to_have_filters?: string[];
  negative_filters?: string[];
  outreach_channel?: OutreachChannel | null;
  name?: string;
};

export type MissionPreviewVM = {
  suggestedName: string;
  suggestedDescription: string;
  summary: string;
  suggestedLanguage: string;
  estimatedYieldLow: number;
  estimatedYieldHigh: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  coverageWarning: string | null;
};

export type MissionSuggestionsVM = {
  industries: string[];
  businessSizes: string[];
  defaultLanguage: string;
};

export type TargetKeywordsVM = {
  keywords: string[];
  source: string;
};

export type ProspectSegmentVM = {
  id: string;
  label: string;
  target: string;
  reason: string;
  triggerSignals: string[];
  buyerRoles: string[];
};

const prospectSegmentsSchema = z
  .object({
    segments: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        target: z.string(),
        reason: z.string(),
        trigger_signals: z.array(z.string()).default([]),
        buyer_roles: z.array(z.string()).default([]),
      }),
    ),
    source: z.string(),
  })
  .transform((dto) => ({
    segments: dto.segments.map((segment) => ({
      id: segment.id,
      label: segment.label,
      target: segment.target,
      reason: segment.reason,
      triggerSignals: segment.trigger_signals,
      buyerRoles: segment.buyer_roles,
    })),
    source: dto.source,
  }));

const targetKeywordsSchema = z
  .object({
    keywords: z.array(z.string()),
    source: z.string(),
  })
  .transform((dto) => ({
    keywords: dto.keywords,
    source: dto.source,
  }));

export type MissionAssistPayload = {
  query: string;
  current_location?: string;
};

export type MissionAssistVM = {
  target: string;
  targetLabel: string;
  relatedTargets: string[];
  location: string;
  buyerRoles: string[];
  triggerSignals: string[];
  mustHaveFilters: string[];
  niceToHaveFilters: string[];
  negativeFilters: string[];
  missionPriority: MissionPriority | null;
  outreachChannel: OutreachChannel | null;
  targetBusinessSize: string | null;
  suggestedLeadCount: number;
  reasoning: string;
  source: string;
};

const missionPreviewSchema = z
  .object({
    suggested_name: z.string(),
    suggested_description: z.string(),
    summary: z.string(),
    suggested_language: z.string(),
    estimated_yield_low: z.number(),
    estimated_yield_high: z.number(),
    difficulty: z.enum(['easy', 'moderate', 'hard']),
    coverage_warning: z.string().nullable(),
  })
  .transform((dto) => ({
    suggestedName: dto.suggested_name,
    suggestedDescription: dto.suggested_description,
    summary: dto.summary,
    suggestedLanguage: dto.suggested_language,
    estimatedYieldLow: dto.estimated_yield_low,
    estimatedYieldHigh: dto.estimated_yield_high,
    difficulty: dto.difficulty,
    coverageWarning: dto.coverage_warning,
  }));

const missionSuggestionsSchema = z
  .object({
    industries: z.array(z.string()),
    business_sizes: z.array(z.string()),
    default_language: z.string(),
  })
  .transform((dto) => ({
    industries: dto.industries,
    businessSizes: dto.business_sizes,
    defaultLanguage: dto.default_language,
  }));

const missionAssistSchema = z
  .object({
    target: z.string(),
    target_label: z.string(),
    related_targets: z.array(z.string()),
    location: z.string(),
    buyer_roles: z.array(z.string()),
    trigger_signals: z.array(z.string()),
    must_have_filters: z.array(z.string()),
    nice_to_have_filters: z.array(z.string()),
    negative_filters: z.array(z.string()),
    mission_priority: z.enum(missionPriorities).nullable(),
    outreach_channel: z.enum(outreachChannels).nullable(),
    target_business_size: z.string().nullable(),
    suggested_lead_count: z.number(),
    reasoning: z.string(),
    source: z.string(),
  })
  .transform((dto) => ({
    target: dto.target,
    targetLabel: dto.target_label,
    relatedTargets: dto.related_targets,
    location: dto.location,
    buyerRoles: dto.buyer_roles,
    triggerSignals: dto.trigger_signals,
    mustHaveFilters: dto.must_have_filters,
    niceToHaveFilters: dto.nice_to_have_filters,
    negativeFilters: dto.negative_filters,
    missionPriority: dto.mission_priority,
    outreachChannel: dto.outreach_channel,
    targetBusinessSize: dto.target_business_size,
    suggestedLeadCount: dto.suggested_lead_count,
    reasoning: dto.reasoning,
    source: dto.source,
  }));

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

async function previewMission(payload: MissionPreviewPayload) {
  const { data } = await axios.post(`${API_BASE_URL}/missions/preview`, payload);
  return missionPreviewSchema.parse(data);
}

async function fetchMissionSuggestions(signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/missions/suggestions`, { signal });
  return missionSuggestionsSchema.parse(data);
}

async function fetchProspectSegments(signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/missions/prospect-segments`, { signal });
  return prospectSegmentsSchema.parse(data);
}

async function fetchTargetKeywords(signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/missions/target-keywords`, { signal });
  return targetKeywordsSchema.parse(data);
}

async function assistMission(payload: MissionAssistPayload) {
  const { data } = await axios.post(`${API_BASE_URL}/missions/assist`, payload);
  return missionAssistSchema.parse(data);
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

export const searchProgressPhases = [
  'idle',
  'planning',
  'searching',
  'refining',
  'evaluating',
  'extracting',
  'scoring',
  'done',
  'failed',
] as const;

export type SearchProgressPhase = (typeof searchProgressPhases)[number];

const searchProgressSchema = z
  .object({
    phase: z.enum(searchProgressPhases),
    queries_planned: z.number(),
    queries_run: z.number(),
    results_found: z.number(),
    pages_fetched: z.number(),
    emails_found: z.number(),
    phones_found: z.number(),
    candidates_built: z.number(),
    duplicates_removed: z.number(),
    leads_scored: z.number(),
    shortlisted: z.number(),
    rejected: z.number(),
    elapsed_ms: z.number(),
    search_mode: z.string().optional(),
    deep_round: z.number().optional(),
    deep_rounds_total: z.number().optional(),
  })
  .transform((dto) => ({
    phase: dto.phase,
    queriesPlanned: dto.queries_planned,
    queriesRun: dto.queries_run,
    resultsFound: dto.results_found,
    pagesFetched: dto.pages_fetched,
    emailsFound: dto.emails_found,
    phonesFound: dto.phones_found,
    candidatesBuilt: dto.candidates_built,
    duplicatesRemoved: dto.duplicates_removed,
    leadsScored: dto.leads_scored,
    shortlisted: dto.shortlisted,
    rejected: dto.rejected,
    elapsedMs: dto.elapsed_ms,
    searchMode: dto.search_mode ?? 'Balanced search',
    deepRound: dto.deep_round ?? 0,
    deepRoundsTotal: dto.deep_rounds_total ?? 0,
  }));

export type SearchProgressVM = z.infer<typeof searchProgressSchema>;

export const searchProgressQueryKey = (missionId: number) =>
  ['mission-search-progress', missionId] as const;

async function fetchSearchProgress(missionId: number, signal?: AbortSignal) {
  const { data } = await axios.get(
    `${API_BASE_URL}/missions/${missionId}/search-progress`,
    { signal },
  );
  return searchProgressSchema.parse(data);
}

export function useMissionSearchProgress(
  missionId: number,
  options: { enabled?: boolean; poll?: boolean } = {},
) {
  return useQuery({
    queryKey: searchProgressQueryKey(missionId),
    queryFn: ({ signal }) => fetchSearchProgress(missionId, signal),
    enabled: options.enabled ?? true,
    refetchInterval: options.poll ? 1_000 : false,
    staleTime: options.poll ? 0 : 30_000,
  });
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

export const prospectSegmentsQueryKey = ['prospect-segments'] as const;

export function useProspectSegments(profileRevision?: string, enabled = true) {
  return useQuery({
    queryKey: [...prospectSegmentsQueryKey, profileRevision ?? 'none'],
    queryFn: ({ signal }) => fetchProspectSegments(signal),
    enabled,
    staleTime: 0,
  });
}

export const targetKeywordsQueryKey = ['target-keywords'] as const;

export function useTargetKeywords(enabled = true) {
  return useQuery({
    queryKey: targetKeywordsQueryKey,
    queryFn: ({ signal }) => fetchTargetKeywords(signal),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useMissionSuggestions() {
  return useQuery({
    queryKey: ['mission-suggestions'],
    queryFn: ({ signal }) => fetchMissionSuggestions(signal),
  });
}

export function useMissionPreview() {
  return useMutation({
    mutationFn: previewMission,
  });
}

export function useMissionAssist() {
  return useMutation({
    mutationFn: assistMission,
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MissionUpdatePayload }) =>
      updateMission(id, payload),
    onSuccess: (mission, variables) => {
      queryClient.setQueryData(missionQueryKey(variables.id), mission);
      void queryClient.invalidateQueries({ queryKey: ['missions'] });
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
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
