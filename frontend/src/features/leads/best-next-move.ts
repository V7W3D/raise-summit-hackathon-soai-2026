import type { LeadVM } from './use-leads-api-queries';

export type NextMoveAction = 'email' | 'call' | 'enrich' | 'deprioritize';

export type BestNextMove = {
  action: NextMoveAction;
  label: string;
  /** Preferred outreach channel, when the action is an outreach action. */
  channel: 'email' | 'call' | null;
  /** One-sentence, evidence-grounded reason for the recommendation. */
  reason: string;
};

const URGENCY_PATTERN = /24|7j\/7|urgen|emergency|same day|d[eé]pannage|intervention rapide/i;
const PHONE_FIRST_PATTERN = /phone|call|appel/i;

function firstSignalMatching(lead: LeadVM, pattern: RegExp): string | null {
  const hit = lead.why.find((signal) => pattern.test(signal));
  if (hit) return hit.toLowerCase();
  if (pattern.test(lead.description)) return lead.description.toLowerCase();
  return null;
}

/**
 * Deterministic recommendation derived from the same fields the scoring
 * pipeline already produces (fit score, contactability, why-signals).
 * Every branch states its reason so the UI never shows a magic verdict.
 */
export function bestNextMove(lead: LeadVM): BestNextMove {
  if (lead.score < 60) {
    return {
      action: 'deprioritize',
      label: 'Deprioritize for now',
      channel: null,
      reason: `Fit score is ${lead.score} — weak match with the mission target. Park it and spend the time on higher-fit leads.`,
    };
  }

  if (!lead.email && !lead.phone) {
    return {
      action: 'enrich',
      label: 'Enrich before contacting',
      channel: null,
      reason:
        'Good fit but no direct email or phone was verified — find a contact point first so the outreach lands with a person.',
    };
  }

  const urgencySignal = firstSignalMatching(lead, URGENCY_PATTERN);
  const phoneSignal = firstSignalMatching(lead, PHONE_FIRST_PATTERN);

  if (lead.phone && lead.score >= 75 && (urgencySignal || phoneSignal)) {
    return {
      action: 'call',
      label: 'Call first',
      channel: 'call',
      reason: `This business is phone-first (${urgencySignal ?? phoneSignal}) — a direct call will outperform a cold email here.`,
    };
  }

  if (lead.email) {
    return {
      action: 'email',
      label: 'Email now',
      channel: 'email',
      reason: lead.phone
        ? `Email found and fit score is ${lead.score} — open with a short value-first email, keep the phone for the follow-up.`
        : `Email is the only verified contact point — send a short value-first email referencing their signals.`,
    };
  }

  return {
    action: 'call',
    label: 'Call first',
    channel: 'call',
    reason: 'Phone is the only verified contact point — call directly and keep the pitch under 20 seconds.',
  };
}
