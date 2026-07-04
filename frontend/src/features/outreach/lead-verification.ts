import type { LeadVM } from '../leads/use-leads-api-queries';
import type { LeadVerification, VerificationCheck, VerificationStatus } from './outreach-types';

function verificationStatus(checks: VerificationCheck[]): VerificationStatus {
  const passed = checks.filter((check) => check.passed).length;
  if (passed >= 5) return 'verified';
  if (passed >= 3) return 'partial';
  return 'unverified';
}

function statusLabel(status: VerificationStatus): string {
  switch (status) {
    case 'verified':
      return 'AI-verified lead';
    case 'partial':
      return 'Partially verified';
    case 'unverified':
      return 'Needs verification';
  }
}

function statusSummary(status: VerificationStatus, lead: LeadVM): string {
  switch (status) {
    case 'verified':
      return `${lead.name} has strong evidence across website, contact points, and fit signals. Safe to outreach with confidence.`;
    case 'partial':
      return `${lead.name} has usable contact info but some gaps remain. Personalize carefully and verify missing details before sending.`;
    case 'unverified':
      return `${lead.name} lacks enough verified signals. Consider investigating further before outreach.`;
  }
}

export function buildLeadVerification(lead: LeadVM): LeadVerification {
  const checks: VerificationCheck[] = [
    {
      id: 'website',
      label: 'Active website',
      passed: Boolean(lead.website),
      detail: lead.website ? `Scanned ${lead.website}` : 'No website on record',
    },
    {
      id: 'email',
      label: 'Email found',
      passed: Boolean(lead.email),
      detail: lead.email ? lead.email : 'No email captured yet',
    },
    {
      id: 'phone',
      label: 'Phone found',
      passed: Boolean(lead.phone),
      detail: lead.phone ? lead.phone : 'No phone number captured yet',
    },
    {
      id: 'evidence',
      label: 'Website evidence',
      passed: lead.evidence.length >= 2,
      detail:
        lead.evidence.length >= 2
          ? `${lead.evidence.length} snippets from scanned pages`
          : lead.evidence.length === 1
            ? 'Only 1 evidence snippet — limited proof'
            : 'No evidence snippets captured',
    },
    {
      id: 'fit',
      label: 'Fit score threshold',
      passed: lead.score >= 60,
      detail: `${lead.score} fit · ${lead.scoreLabel}`,
    },
    {
      id: 'location',
      label: 'Location match',
      passed: Boolean(lead.location.trim()),
      detail: lead.location.trim() || 'Location not confirmed',
    },
    {
      id: 'sources',
      label: 'Source scan complete',
      passed: lead.sourcesScanned.length >= 2,
      detail:
        lead.sourcesScanned.length >= 2
          ? `${lead.sourcesScanned.length} pages scanned`
          : lead.sourcesScanned.length === 1
            ? 'Only 1 page scanned'
            : 'No scan timeline available',
    },
  ];

  const status = verificationStatus(checks);

  return {
    status,
    statusLabel: statusLabel(status),
    summary: statusSummary(status, lead),
    checks,
    sourcesScanned: lead.sourcesScanned.length,
    lastScanned: lead.sourcesScanned[0]?.time ?? null,
    evidenceCount: lead.evidence.length,
  };
}

export function verificationPillClass(status: VerificationStatus): string {
  switch (status) {
    case 'verified':
      return 'pill-green';
    case 'partial':
      return 'pill-orange';
    case 'unverified':
      return 'pill-blue';
  }
}
