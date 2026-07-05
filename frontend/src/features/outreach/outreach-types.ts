export type OutreachChannel = 'email' | 'linkedin' | 'call';

export type OutreachDraft = {
  channel: OutreachChannel;
  subject: string;
  body: string;
};

export type TipSeverity = 'good' | 'warning' | 'improve';

export type OutreachTip = {
  id: string;
  severity: TipSeverity;
  title: string;
  detail: string;
  impact: number;
};

export type OutreachScore = {
  score: number;
  label: string;
  tips: OutreachTip[];
};

export const OUTREACH_CHANNEL_LABELS: Record<OutreachChannel, string> = {
  email: 'Email',
  linkedin: 'LinkedIn',
  call: 'Call script',
};
