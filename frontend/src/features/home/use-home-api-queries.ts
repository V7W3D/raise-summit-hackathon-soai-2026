import axios from 'axios';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';

const prioritySchema = z.enum(['High', 'Medium', 'Low']);

const dashboardSchema = z
  .object({
    user: z.object({
      name: z.string(),
    }),
    greeting: z.string(),
    subtitle: z.string(),
    next_best_actions: z.array(
      z.object({
        icon: z.string(),
        priority: z.string(),
        title: z.string(),
        subtitle: z.string().nullable(),
      }),
    ),
    stats: z.array(
      z.object({
        icon: z.string(),
        label: z.string(),
        value: z.string(),
      }),
    ),
    opportunity_feed: z.array(
      z.object({
        dot: z.string(),
        icon: z.string(),
        text: z.string(),
        time: z.string(),
      }),
    ),
    recent_missions: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        updated: z.string(),
        progress: z.number(),
      }),
    ),
    recent_prospects: z.array(
      z.object({
        id: z.number(),
        initials: z.string(),
        color: z.string(),
        name: z.string(),
        meta: z.string(),
        fit: z.string(),
        fit_tone: z.string(),
        time: z.string(),
      }),
    ),
  })
  .transform((dto) => ({
    user: dto.user,
    greeting: dto.greeting,
    subtitle: dto.subtitle,
    nextBestActions: dto.next_best_actions.map((a) => ({
      icon: a.icon,
      priority: prioritySchema.parse(a.priority),
      title: a.title,
      subtitle: a.subtitle ?? undefined,
    })),
    stats: dto.stats,
    opportunityFeed: dto.opportunity_feed,
    recentMissions: dto.recent_missions,
    recentProspects: dto.recent_prospects.map((p) => ({
      id: p.id,
      initials: p.initials,
      color: p.color,
      name: p.name,
      meta: p.meta,
      fit: p.fit,
      fitTone: p.fit_tone,
      time: p.time,
    })),
  }));

export type DashboardVM = z.infer<typeof dashboardSchema>;

export const dashboardQueryKey = ['dashboard'] as const;

async function fetchDashboard(signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/home/dashboard`, { signal });
  return dashboardSchema.parse(data);
}

export function useDashboard() {
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: ({ signal }) => fetchDashboard(signal),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: ({ signal }) => fetchDashboard(signal),
    select: (data) => data.user,
  });
}
