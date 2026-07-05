import axios from 'axios';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '../../api/config';
import type { OutreachChannel } from './outreach-types';

export type OutreachAngle = 'missed_calls' | 'customer_service' | 'growth';

export const OUTREACH_ANGLE_LABELS: Record<OutreachAngle, string> = {
  missed_calls: 'Missed calls',
  customer_service: 'Customer service',
  growth: 'Growth',
};

const followupTouchSchema = z.object({
  day: z.number(),
  channel: z.string(),
  goal: z.string(),
  message_idea: z.string(),
});

export type FollowupTouch = z.infer<typeof followupTouchSchema>;

const outreachDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
  why_now: z.string(),
  evidence_used: z.array(z.string()),
  followup_hint: z.string(),
  followup_plan: z.array(followupTouchSchema).default([]),
  source: z.string(),
});

export type OutreachDraftVM = z.infer<typeof outreachDraftSchema>;

export type OutreachDraftRequest = {
  leadId: number;
  channel: OutreachChannel;
  angle: OutreachAngle;
};

async function fetchOutreachDraft(request: OutreachDraftRequest) {
  const { data } = await axios.post(`${API_BASE_URL}/outreach/draft`, {
    lead_id: request.leadId,
    channel: request.channel,
    angle: request.angle,
  });
  return outreachDraftSchema.parse(data);
}

export function useOutreachDraft() {
  return useMutation({ mutationFn: fetchOutreachDraft });
}
