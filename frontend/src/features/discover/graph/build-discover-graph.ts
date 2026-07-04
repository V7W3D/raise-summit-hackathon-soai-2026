import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import { fitColor } from '@components/ScoreRing';
import type { LeadVM } from '../../leads/use-leads-api-queries';
import { clusterKey, scoreNodeRadius, type ClusterMode } from '../discover-utils';

export type GraphNodeKind = 'lead' | 'hub';

export type GraphNode = SimulationNodeDatum & {
  id: string;
  kind: GraphNodeKind;
  clusterId: string;
  label: string;
  leadId?: number;
  initials?: string;
  score?: number;
  logoColor?: string;
  radius: number;
  color: string;
};

export type GraphLink = SimulationLinkDatum<GraphNode> & {
  id: string;
};

export type GraphCluster = {
  id: string;
  label: string;
  color: string;
  leadIds: number[];
  hubId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DiscoverGraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
  clusters: GraphCluster[];
};

const HUB_RADIUS = 6;
const CLUSTER_PADDING = 52;

function clusterGrid(count: number, width: number, height: number) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / cols);
  const cellW = width / cols;
  const cellH = height / rows;

  return Array.from({ length: count }, (_, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: cellW * col + cellW / 2,
      y: cellH * row + cellH / 2,
    };
  });
}

function placeInitialNodes(
  leads: LeadVM[],
  mode: ClusterMode,
  width: number,
  height: number,
): DiscoverGraphData {
  const grouped = new Map<string, LeadVM[]>();

  for (const lead of leads) {
    const key = clusterKey(lead, mode);
    const bucket = grouped.get(key) ?? [];
    bucket.push(lead);
    grouped.set(key, bucket);
  }

  const clusterEntries = [...grouped.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );
  const centers = clusterGrid(clusterEntries.length, width, height);

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const clusters: GraphCluster[] = [];

  clusterEntries.forEach(([label, clusterLeads], index) => {
    const clusterId = `cluster_${index}`;
    const hubId = `hub_${index}`;
    const center = centers[index] ?? { x: width / 2, y: height / 2 };
    const color = clusterLeads[0] ? fitColor(clusterLeads[0].score) : '#78716c';

    const hub: GraphNode = {
      id: hubId,
      kind: 'hub',
      clusterId,
      label,
      radius: HUB_RADIUS,
      color,
      x: center.x,
      y: center.y,
    };
    nodes.push(hub);

    clusterLeads.forEach((lead, leadIndex) => {
      const angle = (leadIndex / clusterLeads.length) * Math.PI * 2;
      const orbit = 36 + clusterLeads.length * 4;
      const leadNode: GraphNode = {
        id: `lead_${lead.id}`,
        kind: 'lead',
        clusterId,
        label: lead.name,
        leadId: lead.id,
        initials: lead.initials,
        score: lead.score,
        logoColor: lead.logoColor,
        radius: scoreNodeRadius(lead.score),
        color: fitColor(lead.score),
        x: center.x + Math.cos(angle) * orbit,
        y: center.y + Math.sin(angle) * orbit,
      };
      nodes.push(leadNode);
      links.push({
        id: `${hubId}_${leadNode.id}`,
        source: hub,
        target: leadNode,
      });
    });

    clusters.push({
      id: clusterId,
      label,
      color,
      leadIds: clusterLeads.map((lead) => lead.id),
      hubId,
      x: center.x,
      y: center.y,
      width: 0,
      height: 0,
    });
  });

  return { nodes, links, clusters };
}

function clusterForce(nodes: GraphNode[], strength = 0.08) {
  return (alpha: number) => {
    const hubs = new Map(nodes.filter((node) => node.kind === 'hub').map((hub) => [hub.clusterId, hub]));

    for (const node of nodes) {
      if (node.kind !== 'lead') continue;
      const hub = hubs.get(node.clusterId);
      if (!hub || hub.x == null || hub.y == null || node.x == null || node.y == null) continue;
      node.vx = (node.vx ?? 0) + (hub.x - node.x) * strength * alpha;
      node.vy = (node.vy ?? 0) + (hub.y - node.y) * strength * alpha;
    }
  };
}

function computeClusterBounds(nodes: GraphNode[], clusters: GraphCluster[]): GraphCluster[] {
  return clusters.map((cluster) => {
    const members = nodes.filter(
      (node) => node.clusterId === cluster.id && node.kind === 'lead' && node.x != null && node.y != null,
    );
    if (members.length === 0) return cluster;

    const hub = nodes.find((node) => node.id === cluster.hubId);
    const xs = members.map((node) => node.x as number);
    const ys = members.map((node) => node.y as number);
    if (hub?.x != null) xs.push(hub.x);
    if (hub?.y != null) ys.push(hub.y);

    const minX = Math.min(...xs) - CLUSTER_PADDING;
    const maxX = Math.max(...xs) + CLUSTER_PADDING;
    const minY = Math.min(...ys) - CLUSTER_PADDING - 18;
    const maxY = Math.max(...ys) + CLUSTER_PADDING;

    return {
      ...cluster,
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY,
    };
  });
}

export function buildDiscoverGraph(
  leads: LeadVM[],
  mode: ClusterMode,
  width: number,
  height: number,
): DiscoverGraphData {
  if (leads.length === 0) {
    return { nodes: [], links: [], clusters: [] };
  }

  const graph = placeInitialNodes(leads, mode, width, height);

  const simulation = forceSimulation(graph.nodes)
    .force(
      'link',
      forceLink<GraphNode, GraphLink>(graph.links)
        .id((node) => node.id)
        .distance((link) => {
          const target = link.target as GraphNode;
          return 28 + (target.radius ?? 20) * 1.4;
        })
        .strength(0.65),
    )
    .force('charge', forceManyBody<GraphNode>().strength(-120))
    .force(
      'collide',
      forceCollide<GraphNode>()
        .radius((node) => node.radius + (node.kind === 'lead' ? 8 : 2))
        .strength(0.85),
    )
    .force('center', forceCenter(width / 2, height / 2).strength(0.06))
    .force('cluster', clusterForce(graph.nodes))
    .stop();

  for (let tick = 0; tick < 320; tick += 1) {
    simulation.tick();
  }

  graph.clusters = computeClusterBounds(graph.nodes, graph.clusters);
  return graph;
}
