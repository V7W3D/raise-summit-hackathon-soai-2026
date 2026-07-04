/**
 * Fallback view-models derived from the bundled mock data. Used when the
 * backend is unreachable so the UI always renders something sensible.
 */

import {
  bestPatterns,
  discoverLeads,
  evidenceSnippets,
  evidenceTimeline,
  funnelDrops,
  funnelStages,
  homeStats,
  missionPerformance,
  missions as mockMissions,
  nextBestActions,
  opportunityFeed,
  recommendations,
  recentMissions,
  recentProspects,
  sourceQuality,
  weeklyChanges,
} from '../data/mock';
import type { DashboardVM, InsightsVM, LeadVM, MissionVM } from './models';

export const DASHBOARD_FALLBACK: DashboardVM = {
  user: { name: 'Azzedine', plan: 'Enterprise Plan', initials: 'AZ' },
  greeting: 'Good morning, Azzedine 👋',
  subtitle: 'You have 3 prospects waiting for review and 2 follow-ups due today.',
  nextBestActions: nextBestActions.map((a) => ({ ...a })),
  stats: homeStats.map((s) => ({ ...s })),
  opportunityFeed: opportunityFeed.map((f) => ({ ...f })),
  recentMissions: recentMissions.map((m, i) => ({ id: i + 1, ...m })),
  recentProspects: recentProspects.map((p, i) => ({
    id: i + 1,
    slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    initials: p.initials,
    color: p.color,
    name: p.name,
    meta: p.meta,
    fit: p.fit,
    fitTone: p.fitTone,
    time: p.time,
  })),
};

export const MISSIONS_FALLBACK: MissionVM[] = mockMissions.map((m, i) => ({
  id: i + 1,
  icon: m.icon,
  color: m.color,
  name: m.name,
  target: m.target,
  type: m.type,
  location: m.location,
  leadsFound: m.leadsFound,
  qualified: m.qualified,
  outreach: m.outreach,
  progress: m.progress,
  status: m.status,
  statusTone: m.statusTone,
  lastActivity: m.lastActivity,
}));

export const LEADS_FALLBACK: LeadVM[] = discoverLeads.map((lead, i) => ({
  id: lead.id,
  numericId: i + 1,
  missionId: 1,
  initials: lead.initials,
  logoColor: lead.logoColor,
  name: lead.name,
  description: lead.description,
  location: lead.location,
  website: lead.website,
  email: i === 0 ? 'contact@rhoneplomberie.fr' : '',
  phone: i === 0 ? '04 78 123 456' : '',
  contactBadge: lead.contactBadge,
  score: lead.score,
  scoreLabel: lead.scoreLabel,
  scoreTone: lead.scoreTone,
  contactability: i === 0 ? 72 : 55,
  confidence: i === 0 ? 'High' : 'Medium',
  status: lead.scoreLabel,
  category: 'high_fit',
  industry: 'Plumbing / Home Services',
  employees: '10 – 50',
  serviceArea: 'Lyon & surrounding area',
  businessType: 'Local service business',
  why: lead.why,
  missing: lead.missing,
  recommended: lead.recommended,
  evidence: i === 0 ? evidenceSnippets.map((e) => ({ ...e })) : [],
  sourcesScanned: i === 0 ? evidenceTimeline.map((e) => ({ ...e })) : [],
  aiSummary:
    i === 0
      ? 'Rhône Plomberie is a strong fit: clear local focus in Lyon, 24/7 emergency service, and phone-first customer acquisition. Uncertainty: generic email (no named contact) and limited team info.'
      : '',
}));

export const INSIGHTS_FALLBACK: InsightsVM = {
  missionId: null,
  missionName: 'Construction Clients – Lyon',
  dateRange: 'May 23 – May 30, 2025',
  performance: missionPerformance.map((p) => ({ ...p })),
  funnelStages: funnelStages.map((s) => ({ ...s })),
  funnelDrops: funnelDrops.map((d) => ({ ...d })),
  weeklyChanges: weeklyChanges.map((w) => ({ ...w })),
  bestPatterns: bestPatterns.map((b) => ({ ...b })),
  sourceQuality: sourceQuality.map((s) => ({ ...s })),
  recommendations: recommendations.map((r) => ({ ...r })),
};
