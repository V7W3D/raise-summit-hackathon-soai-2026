/** View-model shapes consumed by the pages (camelCase). */

import type { Priority } from '../data/mock';

export type DashboardVM = {
  user: { name: string; plan: string; initials: string };
  greeting: string;
  subtitle: string;
  nextBestActions: Array<{ icon: string; priority: Priority; title: string; subtitle?: string }>;
  stats: Array<{ icon: string; label: string; value: string }>;
  opportunityFeed: Array<{ dot: string; icon: string; text: string; time: string }>;
  recentMissions: Array<{
    id: number;
    icon: string;
    color: string;
    name: string;
    updated: string;
    progress: number;
    leads: number;
  }>;
  recentProspects: Array<{
    id: number;
    slug: string;
    initials: string;
    color: string;
    name: string;
    meta: string;
    fit: string;
    fitTone: string;
    time: string;
  }>;
};

export type MissionVM = {
  id: number;
  icon: string;
  color: string;
  name: string;
  target: string;
  type: string;
  location: string;
  leadsFound: number;
  qualified: number;
  outreach: number;
  progress: number;
  status: string;
  statusTone: string;
  lastActivity: string;
};

export type LeadVM = {
  id: string; // slug
  numericId: number;
  missionId: number;
  initials: string;
  logoColor: string;
  name: string;
  description: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  contactBadge: string;
  score: number;
  scoreLabel: string;
  scoreTone: 'green' | 'blue' | 'orange';
  contactability: number;
  confidence: string;
  status: string;
  category: string;
  industry: string;
  employees: string;
  serviceArea: string;
  businessType: string;
  why: string[];
  missing: string[];
  recommended: string[];
  evidence: Array<{ quote: string; source: string }>;
  sourcesScanned: Array<{ label: string; time: string }>;
  aiSummary: string;
};

export type InsightsVM = {
  missionId: number | null;
  missionName: string;
  dateRange: string;
  performance: Array<{ icon: string; label: string; value: string; delta: string; deltaTone: string }>;
  funnelStages: Array<{ label: string; value: string; pct: string }>;
  funnelDrops: Array<{ delta: string; tone: string; note: string }>;
  weeklyChanges: Array<{ icon: string; tone: string; title: string; text: string }>;
  bestPatterns: Array<{ rank: number; icon: string; title: string; text: string; level: string }>;
  sourceQuality: Array<{ icon: string; name: string; qualified: number; reply: number; starred: boolean }>;
  recommendations: Array<{ icon: string; title: string; text: string }>;
};
