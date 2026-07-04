import type { LeadVM } from '../leads/use-leads-api-queries';
import type { OutreachChannel, OutreachDraft } from './outreach-types';

const DEFAULT_MISSION = {
  name: 'Construction Clients – Lyon',
  offer: 'AI call reception for inbound calls',
  audience: 'local service businesses',
};

function cityFromLocation(location: string): string {
  return location.split(',')[0]?.trim() || location.trim();
}

function pickSignal(lead: LeadVM): string {
  if (lead.why.length > 0) return lead.why[0].toLowerCase();
  if (lead.evidence.length > 0) {
    const snippet = lead.evidence[0].quote.replace(/^["“]+|["”]+$/g, '').trim();
    return snippet.length > 90 ? `${snippet.slice(0, 87)}…` : snippet;
  }
  return lead.description.toLowerCase();
}

function pickValueHook(lead: LeadVM): string {
  const lowerWhy = lead.why.map((item) => item.toLowerCase());
  if (lowerWhy.some((item) => item.includes('emergency') || item.includes('24'))) {
    return 'capture urgent inbound calls even when your team is already on-site';
  }
  if (lowerWhy.some((item) => item.includes('phone'))) {
    return 'make sure every inbound call gets answered quickly and professionally';
  }
  if (lowerWhy.some((item) => item.includes('local'))) {
    return 'help local teams stay responsive without adding headcount';
  }
  return 'handle overflow inbound calls with a consistent, professional first response';
}

function greeting(lead: LeadVM): string {
  const missingDecisionMaker = lead.missing.some((item) =>
    /manager|owner|decision|director|founder/i.test(item),
  );
  if (missingDecisionMaker) return `Hi ${lead.name} team,`;
  return `Hi team at ${lead.name},`;
}

function ctaFromRecommendation(lead: LeadVM): string {
  const rec = lead.recommended[0]?.toLowerCase() ?? '';
  if (rec.includes('phone')) {
    return 'Would a quick 12-minute call this week work to see if this fits how you handle inbound calls?';
  }
  if (rec.includes('case study')) {
    return 'Happy to share a short case study from a similar local business — would that be useful this week?';
  }
  if (rec.includes('verify')) {
    return 'If this is relevant, I can send a 2-line overview and you can tell me if it is worth a brief call.';
  }
  return 'Open to a short call this week to see if this is relevant for how you handle inbound requests?';
}

function buildEmailDraft(lead: LeadVM, mission = DEFAULT_MISSION): OutreachDraft {
  const city = cityFromLocation(lead.location);
  const signal = pickSignal(lead);
  const valueHook = pickValueHook(lead);

  const subject =
    lead.score >= 75
      ? `Quick idea for ${lead.name}'s inbound calls in ${city}`
      : `Idea for ${lead.name} — ${city}`;

  const body = [
    greeting(lead),
    '',
    `I came across ${lead.website ? lead.website : lead.name} and noticed ${signal}.`,
    '',
    `We help ${mission.audience} ${valueHook} through AI call reception.`,
    '',
    ctaFromRecommendation(lead),
    '',
    'Best,',
    '[Your name]',
  ].join('\n');

  return { channel: 'email', subject, body };
}

function buildLinkedInDraft(lead: LeadVM, mission = DEFAULT_MISSION): OutreachDraft {
  const signal = pickSignal(lead);
  const city = cityFromLocation(lead.location);

  const body = [
    `Hi — I noticed ${lead.name} in ${city} (${signal}).`,
    '',
    `We help ${mission.audience} with AI call reception, especially when teams are busy on jobs.`,
    '',
    'Worth a quick chat if you handle a lot of inbound calls?',
  ].join('\n');

  return { channel: 'linkedin', subject: '', body };
}

function buildCallDraft(lead: LeadVM, mission = DEFAULT_MISSION): OutreachDraft {
  const signal = pickSignal(lead);
  const contact = lead.phone || lead.email || 'main line';

  const body = [
    'Opening',
    `"Hi, I'm calling about ${lead.name} — I saw on your site that ${signal}."`,
    '',
    'Value (15 sec)',
    `"We work with ${mission.audience} in ${cityFromLocation(lead.location)} on AI call reception, so urgent calls don't get missed when the team is out."`,
    '',
    'Qualify',
    '- How do you handle calls when everyone is on-site?',
    '- Do missed calls turn into lost jobs for you?',
    '',
    'Close',
    ctaFromRecommendation(lead),
    '',
    `Contact target: ${contact}`,
  ].join('\n');

  return { channel: 'call', subject: `Call script — ${lead.name}`, body };
}

export function generateOutreachDraft(
  lead: LeadVM,
  channel: OutreachChannel,
  missionName?: string,
): OutreachDraft {
  const mission = {
    ...DEFAULT_MISSION,
    name: missionName ?? DEFAULT_MISSION.name,
  };

  switch (channel) {
    case 'email':
      return buildEmailDraft(lead, mission);
    case 'linkedin':
      return buildLinkedInDraft(lead, mission);
    case 'call':
      return buildCallDraft(lead, mission);
  }
}

export function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
