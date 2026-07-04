import axios from 'axios';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';
import { dashboardQueryKey } from '../home/use-home-api-queries';

const STATUS_TONE: Record<string, string> = {
  Active: 'green',
  Draft: 'neutral',
  Paused: 'orange',
  Archived: 'neutral',
};

function statusTone(status: string): string {
  return STATUS_TONE[status] ?? 'neutral';
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

const missionSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    target: z.string(),
    location: z.string(),
    status: z.string(),
    progress: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    last_activity_at: z.string(),
  })
  .transform((dto) => ({
    id: dto.id,
    name: dto.name,
    target: dto.target,
    location: dto.location,
    progress: dto.progress,
    status: dto.status,
    statusTone: statusTone(dto.status),
    lastActivity: relativeTime(dto.last_activity_at),
  }));

export type MissionVM = z.infer<typeof missionSchema>;

export const missionsQueryKey = ['missions'] as const;

type MissionCreatePayload = {
  name: string;
  target?: string;
  location?: string;
  status?: string;
};

async function fetchMissions(signal?: AbortSignal) {
  const { data } = await axios.get(`${API_BASE_URL}/missions`, { signal });
  return z.array(missionSchema).parse(data);
}

async function createMission(payload: MissionCreatePayload) {
  const { data } = await axios.post(`${API_BASE_URL}/missions`, payload);
  return missionSchema.parse(data);
}

export function useMissions() {
  return useQuery({
    queryKey: missionsQueryKey,
    queryFn: ({ signal }) => fetchMissions(signal),
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionsQueryKey });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}
