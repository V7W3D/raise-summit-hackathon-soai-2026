import axios from 'axios';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';

const insightsSchema = z
  .object({
    mission_id: z.number().nullable(),
    mission_name: z.string(),
    date_range: z.string(),
    performance: z.array(
      z.object({
        icon: z.string(),
        label: z.string(),
        value: z.string(),
        delta: z.string(),
        delta_tone: z.string(),
      }),
    ),
    funnel_stages: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
        pct: z.string(),
      }),
    ),
    funnel_drops: z.array(
      z.object({
        delta: z.string(),
        tone: z.string(),
        note: z.string(),
      }),
    ),
    weekly_changes: z.array(
      z.object({
        icon: z.string(),
        tone: z.string(),
        title: z.string(),
        text: z.string(),
      }),
    ),
    best_patterns: z.array(
      z.object({
        rank: z.number(),
        icon: z.string(),
        title: z.string(),
        text: z.string(),
        level: z.string(),
      }),
    ),
    source_quality: z.array(
      z.object({
        icon: z.string(),
        name: z.string(),
        qualified: z.number(),
        reply: z.number(),
        starred: z.boolean(),
      }),
    ),
    recommendations: z.array(
      z.object({
        icon: z.string(),
        title: z.string(),
        text: z.string(),
      }),
    ),
  })
  .transform((dto) => ({
    missionId: dto.mission_id,
    missionName: dto.mission_name,
    dateRange: dto.date_range,
    performance: dto.performance.map((p) => ({
      icon: p.icon,
      label: p.label,
      value: p.value,
      delta: p.delta,
      deltaTone: p.delta_tone,
    })),
    funnelStages: dto.funnel_stages,
    funnelDrops: dto.funnel_drops,
    weeklyChanges: dto.weekly_changes,
    bestPatterns: dto.best_patterns,
    sourceQuality: dto.source_quality,
    recommendations: dto.recommendations,
  }));

export type InsightsVM = z.infer<typeof insightsSchema>;

export const insightsQueryKey = (missionId?: number) => ['insights', { missionId }] as const;

async function fetchInsights(missionId?: number, signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/insights`, {
    params: { mission_id: missionId },
    signal,
  });
  return insightsSchema.parse(data);
}

export function useInsights(missionId?: number) {
  return useQuery({
    queryKey: insightsQueryKey(missionId),
    queryFn: ({ signal }) => fetchInsights(missionId, signal),
  });
}
