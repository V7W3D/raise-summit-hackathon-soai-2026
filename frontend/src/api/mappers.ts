import type { Priority } from '../data/mock';
import type { DashboardDTO, InsightsDTO, LeadDTO, MissionDTO } from './types';
import type { DashboardVM, InsightsVM, LeadVM, MissionVM } from './models';

const STATUS_TONE: Record<string, string> = {
  Active: 'green',
  Draft: 'neutral',
  Paused: 'orange',
  Archived: 'neutral',
};

function statusTone(status: string): string {
  return STATUS_TONE[status] ?? 'neutral';
}

/** Turn an ISO timestamp into a compact relative label (e.g. "3h ago"). */
export function relativeTime(iso: string): string {
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

export function mapMission(dto: MissionDTO): MissionVM {
  return {
    id: dto.id,
    icon: dto.icon,
    color: dto.color,
    name: dto.name,
    target: dto.target,
    type: dto.mission_type,
    location: dto.location,
    leadsFound: dto.leads_found,
    qualified: dto.qualified,
    outreach: dto.outreach_sent,
    progress: dto.progress,
    status: dto.status,
    statusTone: statusTone(dto.status),
    lastActivity: relativeTime(dto.last_activity_at),
  };
}

export function mapLead(dto: LeadDTO): LeadVM {
  return {
    id: dto.slug,
    numericId: dto.id,
    missionId: dto.mission_id,
    initials: dto.initials || dto.name.slice(0, 2).toUpperCase(),
    logoColor: dto.logo_color,
    name: dto.name,
    description: dto.description,
    location: dto.location,
    website: dto.website,
    email: dto.email,
    phone: dto.phone,
    contactBadge: dto.contact_badge,
    score: dto.score,
    scoreLabel: dto.score_label,
    scoreTone: dto.score_tone,
    contactability: dto.contactability,
    confidence: dto.confidence,
    status: dto.status,
    category: dto.category,
    industry: dto.industry,
    employees: dto.employees,
    serviceArea: dto.service_area,
    businessType: dto.business_type,
    why: dto.why,
    missing: dto.missing,
    recommended: dto.recommended,
    evidence: dto.evidence,
    sourcesScanned: dto.sources_scanned,
    aiSummary: dto.ai_summary,
  };
}

export function mapDashboard(dto: DashboardDTO): DashboardVM {
  return {
    user: dto.user,
    greeting: dto.greeting,
    subtitle: dto.subtitle,
    nextBestActions: dto.next_best_actions.map((a) => ({
      icon: a.icon,
      priority: a.priority as Priority,
      title: a.title,
      subtitle: a.subtitle ?? undefined,
    })),
    stats: dto.stats,
    opportunityFeed: dto.opportunity_feed,
    recentMissions: dto.recent_missions,
    recentProspects: dto.recent_prospects.map((p) => ({
      id: p.id,
      slug: p.slug,
      initials: p.initials,
      color: p.color,
      name: p.name,
      meta: p.meta,
      fit: p.fit,
      fitTone: p.fit_tone,
      time: p.time,
    })),
  };
}

export function mapInsights(dto: InsightsDTO): InsightsVM {
  return {
    missionId: dto.mission_id,
    missionName: dto.mission_name,
    dateRange: dto.date_range,
    performance: dto.performance.map((p) => ({
      icon: p.icon,
      label: p.label,
      value: p.value,
      delta: p.delta,
      deltaTone: p.delta_tone,
    })),
    funnelStages: dto.funnel_stages,
    funnelDrops: dto.funnel_drops,
    weeklyChanges: dto.weekly_changes,
    bestPatterns: dto.best_patterns,
    sourceQuality: dto.source_quality,
    recommendations: dto.recommendations,
  };
}
