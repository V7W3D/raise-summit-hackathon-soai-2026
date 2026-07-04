export type ScoreTone = 'green' | 'blue' | 'orange';

const LOGO_COLORS = [
  '#475569',
  '#0ea5e9',
  '#16a34a',
  '#6366f1',
  '#f43f5e',
  '#2563eb',
  '#7c5cf0',
] as const;

export function leadInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function leadLogoColor(name: string): string {
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return LOGO_COLORS[hash % LOGO_COLORS.length];
}

export function leadContactBadge(email: string, phone: string): string {
  if (email && phone) return 'Email + phone found';
  if (email) return 'Email found';
  if (phone) return 'Phone found';
  return 'Contact form found';
}

export function leadScoreLabel(score: number): string {
  if (score >= 75) return 'High fit';
  if (score >= 60) return 'Promising';
  return 'Needs review';
}

export function leadScoreTone(score: number): ScoreTone {
  if (score >= 75) return 'green';
  if (score >= 60) return 'orange';
  return 'blue';
}

export function leadContactability(email: string, phone: string): number {
  let value = 0;
  if (email) value += 40;
  if (phone) value += 40;
  if (email && phone) value += 20;
  return value;
}

export function leadConfidence(score: number): string {
  if (score >= 75) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

export function enrichLeadDisplay<T extends { name: string; email: string; phone: string; score: number }>(
  lead: T,
) {
  return {
    ...lead,
    initials: leadInitials(lead.name),
    logoColor: leadLogoColor(lead.name),
    contactBadge: leadContactBadge(lead.email, lead.phone),
    scoreLabel: leadScoreLabel(lead.score),
    scoreTone: leadScoreTone(lead.score),
    contactability: leadContactability(lead.email, lead.phone),
    confidence: leadConfidence(lead.score),
  };
}
