import type { LeadVM } from '../../leads/use-leads-api-queries';
import {
  ACTION_SEGMENT_META,
  actionSegmentId,
  clusterKey,
  contactabilityScore,
  explainSegment,
  topMissingGap,
  type ActionSegmentId,
  type ClusterMode,
} from '../discover-utils';

export type MapPoint = {
  leadId: number;
  x: number;
  y: number;
  radius: number;
  segmentId: ActionSegmentId;
  contactability: number;
  score: number;
};

export type ActionSegmentGroup = {
  id: ActionSegmentId | string;
  label: string;
  color: string;
  playbook: string;
  priority: number;
  leads: LeadVM[];
  leadIds: number[];
  avgScore: number;
  topGap: string | null;
  explanation: string;
  contactableCount: number;
};

export type OpportunityMapModel = {
  points: MapPoint[];
  segments: ActionSegmentGroup[];
  width: number;
  height: number;
  padding: number;
};

function jitter(seed: number, amount: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return (value - Math.floor(value) - 0.5) * amount;
}

export function buildOpportunityMap(
  leads: LeadVM[],
  width: number,
  height: number,
): OpportunityMapModel {
  const padding = 56;
  const plotWidth = Math.max(width - padding * 2, 200);
  const plotHeight = Math.max(height - padding * 2, 200);

  const points: MapPoint[] = leads.map((lead) => {
    const contactability = contactabilityScore(lead);
    const segmentId = actionSegmentId(lead);
    const baseX = padding + (contactability / 100) * plotWidth;
    const baseY = padding + (1 - lead.score / 100) * plotHeight;

    return {
      leadId: lead.id,
      x: baseX + jitter(lead.id, 22),
      y: baseY + jitter(lead.id + 7, 18),
      radius: 10 + (lead.score / 100) * 8,
      segmentId,
      contactability,
      score: lead.score,
    };
  });

  const segmentMap = new Map<ActionSegmentId, LeadVM[]>();
  for (const lead of leads) {
    const id = actionSegmentId(lead);
    const bucket = segmentMap.get(id) ?? [];
    bucket.push(lead);
    segmentMap.set(id, bucket);
  }

  const segments: ActionSegmentGroup[] = [...segmentMap.entries()]
    .map(([id, segmentLeads]) => {
      const meta = ACTION_SEGMENT_META[id];
      const avgScore = Math.round(
        segmentLeads.reduce((sum, lead) => sum + lead.score, 0) / segmentLeads.length,
      );
      const contactableCount = segmentLeads.filter(
        (lead) => lead.email.trim() || lead.phone.trim(),
      ).length;

      return {
        id,
        label: meta.label,
        color: meta.color,
        playbook: meta.playbook,
        priority: meta.priority,
        leads: segmentLeads,
        leadIds: segmentLeads.map((lead) => lead.id),
        avgScore,
        topGap: topMissingGap(segmentLeads),
        explanation: explainSegment(segmentLeads, id),
        contactableCount,
      };
    })
    .sort((a, b) => a.priority - b.priority);

  return { points, segments, width, height, padding };
}

export function buildClusterGroups(leads: LeadVM[], mode: ClusterMode): ActionSegmentGroup[] {
  const groups = new Map<string, LeadVM[]>();
  for (const lead of leads) {
    const key = clusterKey(lead, mode);
    const bucket = groups.get(key) ?? [];
    bucket.push(lead);
    groups.set(key, bucket);
  }

  return [...groups.entries()]
    .map(([label, segmentLeads]) => {
      const firstLead = segmentLeads[0];
      const segmentId = firstLead ? actionSegmentId(firstLead) : 'needs_verification';
      const meta = ACTION_SEGMENT_META[segmentId];
      const avgScore = Math.round(
        segmentLeads.reduce((sum, lead) => sum + lead.score, 0) / segmentLeads.length,
      );

      return {
        id: segmentId,
        label,
        color: mode === 'action' ? meta.color : undefined,
        playbook: mode === 'action' ? meta.playbook : 'Review segment',
        priority: mode === 'action' ? meta.priority : avgScore * -1,
        leads: segmentLeads,
        leadIds: segmentLeads.map((lead) => lead.id),
        avgScore,
        topGap: topMissingGap(segmentLeads),
        explanation:
          mode === 'action'
            ? explainSegment(segmentLeads, segmentId)
            : `${segmentLeads.length} lead${segmentLeads.length === 1 ? '' : 's'} grouped by ${label.toLowerCase()} — avg score ${avgScore}.`,
        contactableCount: segmentLeads.filter(
          (lead) => lead.email.trim() || lead.phone.trim(),
        ).length,
      };
    })
    .sort((a, b) => a.priority - b.priority)
    .map((group, index) => ({
      ...group,
      color: group.color ?? `hsl(${(index * 47) % 360} 28% 42%)`,
    }));
}
