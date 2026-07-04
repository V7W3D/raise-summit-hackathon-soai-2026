/**
 * Response shapes returned by the FastAPI backend (snake_case).
 * These mirror the Pydantic schemas in backend/models/schemas.
 */

export type MissionDTO = {
  id: number;
  name: string;
  target: string;
  mission_type: string;
  location: string;
  status: string;
  icon: string;
  color: string;
  leads_found: number;
  qualified: number;
  outreach_sent: number;
  progress: number;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
};

export type LeadDTO = {
  id: number;
  slug: string;
  mission_id: number;
  name: string;
  description: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  initials: string;
  logo_color: string;
  contact_badge: string;
  score: number;
  score_label: string;
  score_tone: 'green' | 'blue' | 'orange';
  contactability: number;
  confidence: string;
  status: string;
  category: string;
  industry: string;
  employees: string;
  service_area: string;
  business_type: string;
  why: string[];
  missing: string[];
  recommended: string[];
  evidence: Array<{ quote: string; source: string }>;
  sources_scanned: Array<{ label: string; time: string }>;
  ai_summary: string;
  created_at: string;
  updated_at: string;
};

export type DashboardDTO = {
  user: { name: string; plan: string; initials: string };
  greeting: string;
  subtitle: string;
  next_best_actions: Array<{ icon: string; priority: string; title: string; subtitle: string | null }>;
  stats: Array<{ icon: string; label: string; value: string }>;
  opportunity_feed: Array<{ dot: string; icon: string; text: string; time: string }>;
  recent_missions: Array<{
    id: number;
    icon: string;
    color: string;
    name: string;
    updated: string;
    progress: number;
    leads: number;
  }>;
  recent_prospects: Array<{
    id: number;
    slug: string;
    initials: string;
    color: string;
    name: string;
    meta: string;
    fit: string;
    fit_tone: string;
    time: string;
  }>;
};

export type InsightsDTO = {
  mission_id: number | null;
  mission_name: string;
  date_range: string;
  performance: Array<{ icon: string; label: string; value: string; delta: string; delta_tone: string }>;
  funnel_stages: Array<{ label: string; value: string; pct: string }>;
  funnel_drops: Array<{ delta: string; tone: string; note: string }>;
  weekly_changes: Array<{ icon: string; tone: string; title: string; text: string }>;
  best_patterns: Array<{ rank: number; icon: string; title: string; text: string; level: string }>;
  source_quality: Array<{ icon: string; name: string; qualified: number; reply: number; starred: boolean }>;
  recommendations: Array<{ icon: string; title: string; text: string }>;
};

export type MissionCreatePayload = {
  name: string;
  target?: string;
  mission_type?: string;
  location?: string;
  status?: string;
  icon?: string;
  color?: string;
};
