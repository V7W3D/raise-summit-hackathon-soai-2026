import type { LeadVM } from '../leads/use-leads-api-queries';
import { wordCount } from './generate-outreach-draft';
import type { OutreachChannel, OutreachScore, OutreachTip } from './outreach-types';

const SPAM_PHRASES = [
  'act now',
  'limited time',
  'guaranteed',
  'revolutionary',
  'game-changer',
  'once in a lifetime',
  'click here',
  'dear sir',
  'dear madam',
  'to whom it may concern',
];

function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent outreach';
  if (score >= 70) return 'Strong draft';
  if (score >= 55) return 'Needs polish';
  return 'Rework recommended';
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function containsAny(text: string, phrases: string[]): string | null {
  const lower = text.toLowerCase();
  return phrases.find((phrase) => lower.includes(phrase)) ?? null;
}

function mentionsCompany(body: string, lead: LeadVM): boolean {
  const tokens = lead.name.toLowerCase().split(/\s+/).filter((part) => part.length > 3);
  const lower = body.toLowerCase();
  return tokens.some((token) => lower.includes(token));
}

function mentionsSignal(body: string, lead: LeadVM): boolean {
  const lower = body.toLowerCase();
  return lead.why.some((signal) => {
    const words = signal.toLowerCase().split(/\s+/).filter((word) => word.length > 4);
    return words.some((word) => lower.includes(word));
  });
}

function hasClearCta(body: string): boolean {
  return /(\?|call|chat|week|reply|let me know|would you|open to|worth a)/i.test(body);
}

function valueBeforePitch(body: string, lead: LeadVM): boolean {
  const lower = body.toLowerCase();
  const companyIndex = lower.indexOf(lead.name.split(' ')[0].toLowerCase());
  const pitchIndex = lower.search(/we help|our solution|we work with|we offer/);
  if (companyIndex === -1 || pitchIndex === -1) return false;
  return companyIndex < pitchIndex;
}

export function scoreOutreachDraft(
  lead: LeadVM,
  channel: OutreachChannel,
  subject: string,
  body: string,
): OutreachScore {
  const tips: OutreachTip[] = [];
  let score = 52;

  const words = wordCount(body);
  const combined = `${subject}\n${body}`;

  if (words >= 55 && words <= 130) {
    score += 14;
    tips.push({
      id: 'length',
      severity: 'good',
      title: 'Good message length',
      detail: `${words} words — concise enough to read, long enough to personalize.`,
      impact: 14,
    });
  } else if (words < 40) {
    score -= 8;
    tips.push({
      id: 'length',
      severity: 'warning',
      title: 'Message feels too short',
      detail: 'Add one specific signal about their business to build credibility.',
      impact: -8,
    });
  } else {
    score -= 10;
    tips.push({
      id: 'length',
      severity: 'warning',
      title: 'Message is too long',
      detail: 'Prospects skim. Aim for under 120 words with one clear ask.',
      impact: -10,
    });
  }

  if (mentionsCompany(body, lead)) {
    score += 16;
    tips.push({
      id: 'personalization',
      severity: 'good',
      title: 'Company name included',
      detail: `References ${lead.name} directly — reads personalized, not bulk.`,
      impact: 16,
    });
  } else {
    score -= 12;
    tips.push({
      id: 'personalization',
      severity: 'improve',
      title: 'Add company personalization',
      detail: `Mention ${lead.name} or a detail from their website in the first two lines.`,
      impact: -12,
    });
  }

  if (mentionsSignal(body, lead)) {
    score += 14;
    tips.push({
      id: 'signal',
      severity: 'good',
      title: 'Uses verified fit signal',
      detail: 'You referenced a real reason this lead matches — strong credibility.',
      impact: 14,
    });
  } else if (lead.why.length > 0) {
    tips.push({
      id: 'signal',
      severity: 'improve',
      title: 'Weave in a fit signal',
      detail: `Try referencing: “${lead.why[0]}”.`,
      impact: 0,
    });
  }

  if (hasClearCta(body)) {
    score += 12;
    tips.push({
      id: 'cta',
      severity: 'good',
      title: 'Clear call to action',
      detail: 'One low-friction next step makes replies more likely.',
      impact: 12,
    });
  } else {
    score -= 10;
    tips.push({
      id: 'cta',
      severity: 'warning',
      title: 'Missing a clear ask',
      detail: 'End with one simple question — e.g. a 12-minute call this week.',
      impact: -10,
    });
  }

  if (valueBeforePitch(body, lead)) {
    score += 10;
    tips.push({
      id: 'value-first',
      severity: 'good',
      title: 'Value-first structure',
      detail: 'You lead with their context before introducing your offer.',
      impact: 10,
    });
  } else {
    tips.push({
      id: 'value-first',
      severity: 'improve',
      title: 'Lead with their situation',
      detail: 'Open with what you noticed about them, then introduce your solution.',
      impact: 0,
    });
  }

  const spamHit = containsAny(combined, SPAM_PHRASES);
  if (spamHit) {
    score -= 15;
    tips.push({
      id: 'spam',
      severity: 'warning',
      title: 'Avoid generic sales language',
      detail: `Remove “${spamHit}” — it lowers reply rates for local B2B outreach.`,
      impact: -15,
    });
  } else {
    score += 6;
    tips.push({
      id: 'tone',
      severity: 'good',
      title: 'Professional tone',
      detail: 'No spam triggers detected — message reads consultative.',
      impact: 6,
    });
  }

  if (channel === 'email') {
    const subjectWords = wordCount(subject);
    if (subjectWords >= 4 && subjectWords <= 12) {
      score += 8;
      tips.push({
        id: 'subject',
        severity: 'good',
        title: 'Subject line length',
        detail: 'Subject is scannable on mobile without feeling generic.',
        impact: 8,
      });
    } else if (subject.trim()) {
      tips.push({
        id: 'subject',
        severity: 'improve',
        title: 'Tighten the subject line',
        detail: 'Aim for 6–10 words with the company or city name.',
        impact: 0,
      });
    } else {
      score -= 8;
      tips.push({
        id: 'subject',
        severity: 'warning',
        title: 'Subject line required',
        detail: 'Add a specific subject before sending.',
        impact: -8,
      });
    }
  }

  if (channel === 'email' && !lead.email) {
    score -= 18;
    tips.push({
      id: 'contact',
      severity: 'warning',
      title: 'No email on file',
      detail: 'Verify contact details before sending — consider phone or LinkedIn instead.',
      impact: -18,
    });
  } else if (channel === 'call' && !lead.phone) {
    score -= 18;
    tips.push({
      id: 'contact',
      severity: 'warning',
      title: 'No phone number on file',
      detail: 'Find a direct line or switch to email outreach.',
      impact: -18,
    });
  } else {
    score += 8;
    tips.push({
      id: 'contact',
      severity: 'good',
      title: 'Contact channel available',
      detail: channel === 'email' ? lead.email : channel === 'call' ? lead.phone : 'LinkedIn outreach ready',
      impact: 8,
    });
  }

  if (lead.score >= 75) {
    score += 4;
  }

  const finalScore = clampScore(score);

  return {
    score: finalScore,
    label: scoreLabel(finalScore),
    tips: tips.sort((a, b) => {
      const order = { warning: 0, improve: 1, good: 2 };
      return order[a.severity] - order[b.severity];
    }),
  };
}

export function outreachScoreColor(score: number): string {
  if (score >= 85) return 'var(--green)';
  if (score >= 70) return 'var(--blue)';
  if (score >= 55) return 'var(--orange)';
  return 'var(--red)';
}
