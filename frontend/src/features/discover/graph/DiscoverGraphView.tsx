import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  CircleX,
  Focus,
  MapPin,
  Minus,
  Plus,
  Send,
  Sparkles,
  ZoomIn,
} from 'lucide-react';
import { fitColor } from '@components/ScoreRing';
import type { LeadVM } from '../../leads/use-leads-api-queries';
import {
  CLUSTER_MODE_LABELS,
  clusterColor,
  type ClusterMode,
} from '../discover-utils';
import { buildDiscoverGraph, type GraphCluster, type GraphNode } from './build-discover-graph';
import './discover-graph.css';

type DiscoverGraphViewProps = {
  leads: LeadVM[];
  selectedId: number | null;
  onSelectLead: (id: number) => void;
  onSelectCluster?: (leadIds: number[]) => void;
  onDraftOutreach?: (leadId: number) => void;
};

type Transform = {
  x: number;
  y: number;
  k: number;
};

type TooltipState = {
  node: GraphNode;
  x: number;
  y: number;
} | null;

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.4;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function DiscoverGraphView({
  leads,
  selectedId,
  onSelectLead,
  onSelectCluster,
  onDraftOutreach,
}: DiscoverGraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 900, height: 560 });
  const [clusterMode, setClusterMode] = useState<ClusterMode>('industry');
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);
  const [hoveredLeadId, setHoveredLeadId] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const graph = useMemo(
    () => buildDiscoverGraph(leads, clusterMode, size.width, size.height),
    [leads, clusterMode, size.width, size.height],
  );

  const leadNodes = useMemo(
    () => graph.nodes.filter((node): node is GraphNode & { leadId: number } => node.kind === 'lead' && node.leadId != null),
    [graph.nodes],
  );

  const leadById = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, k: 1 });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setTransform((current) => ({ ...current, k: clampZoom(current.k + delta) }));
  }, []);

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.x,
      originY: transform.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setTransform((current) => ({
      ...current,
      x: drag.originX + (event.clientX - drag.startX),
      y: drag.originY + (event.clientY - drag.startY),
    }));
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    setTransform((current) => ({ ...current, k: clampZoom(current.k + delta) }));
  };

  const toggleClusterSelection = (cluster: GraphCluster) => {
    setBulkSelected((current) => {
      const next = new Set(current);
      const allSelected = cluster.leadIds.every((id) => next.has(id));
      if (allSelected) {
        cluster.leadIds.forEach((id) => next.delete(id));
      } else {
        cluster.leadIds.forEach((id) => next.add(id));
      }
      onSelectCluster?.([...next]);
      return next;
    });
  };

  const selectLeadNode = (node: GraphNode, event: React.MouseEvent) => {
    if (node.leadId == null) return;
    event.stopPropagation();

    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      setBulkSelected((current) => {
        const next = new Set(current);
        if (next.has(node.leadId!)) next.delete(node.leadId!);
        else next.add(node.leadId!);
        onSelectCluster?.([...next]);
        return next;
      });
    } else {
      setBulkSelected(new Set());
      onSelectLead(node.leadId);
    }
  };

  const clearBulk = () => {
    setBulkSelected(new Set());
    onSelectCluster?.([]);
  };

  const insights = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) {
      const key = lead.industry.trim() || 'Uncategorized';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, count]) => ({ label, count }));
  }, [leads]);

  return (
    <div className="discover-graph">
      <div className="discover-graph-toolbar card">
        <div className="discover-graph-toolbar-left">
          <span className="discover-graph-toolbar-label">Group by</span>
          <div className="seg-row discover-graph-seg">
            {(Object.keys(CLUSTER_MODE_LABELS) as ClusterMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`seg-option${clusterMode === mode ? ' selected' : ''}`}
                onClick={() => setClusterMode(mode)}
              >
                {CLUSTER_MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="discover-graph-toolbar-center">
          {insights.map((item) => (
            <span key={item.label} className="discover-graph-insight">
              <span className="discover-graph-insight-dot" style={{ background: clusterColor(item.label, 'industry') }} />
              {item.label} <strong>{item.count}</strong>
            </span>
          ))}
        </div>

        <div className="discover-graph-toolbar-right">
          <button type="button" className="icon-btn bordered" aria-label="Zoom out" onClick={() => zoomBy(-0.15)}>
            <Minus size={15} />
          </button>
          <button type="button" className="icon-btn bordered" aria-label="Zoom in" onClick={() => zoomBy(0.15)}>
            <Plus size={15} />
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={resetView}>
            <Focus size={14} /> Reset view
          </button>
        </div>
      </div>

      <div ref={containerRef} className="discover-graph-canvas card">
        {leads.length === 0 ? (
          <div className="discover-graph-empty">
            <ZoomIn size={28} />
            <p>No leads to visualize in this tab.</p>
          </div>
        ) : (
          <>
            <svg
              className="discover-graph-svg"
              width={size.width}
              height={size.height}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onWheel={handleWheel}
            >
              <defs>
                <pattern id="graph-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="1" fill="var(--border)" />
                </pattern>
              </defs>

              <rect width="100%" height="100%" fill="url(#graph-grid)" />

              <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
                {graph.clusters.map((cluster) => {
                  const isHovered = hoveredClusterId === cluster.id;
                  const selectedInCluster = cluster.leadIds.filter((id) => bulkSelected.has(id)).length;
                  const allSelected = selectedInCluster === cluster.leadIds.length && cluster.leadIds.length > 0;

                  return (
                    <g key={cluster.id}>
                      <rect
                        className={`discover-graph-cluster-zone${isHovered ? ' hovered' : ''}${allSelected ? ' selected' : ''}`}
                        x={cluster.x - cluster.width / 2}
                        y={cluster.y - cluster.height / 2}
                        width={cluster.width}
                        height={cluster.height}
                        rx={18}
                        style={{ stroke: clusterColor(cluster.label, clusterMode) }}
                        onMouseEnter={() => setHoveredClusterId(cluster.id)}
                        onMouseLeave={() => setHoveredClusterId(null)}
                        onClick={() => toggleClusterSelection(cluster)}
                      />
                      <text
                        className="discover-graph-cluster-label"
                        x={cluster.x - cluster.width / 2 + 16}
                        y={cluster.y - cluster.height / 2 + 22}
                        style={{ fill: clusterColor(cluster.label, clusterMode) }}
                      >
                        {cluster.label}
                      </text>
                      <text
                        className="discover-graph-cluster-count"
                        x={cluster.x + cluster.width / 2 - 16}
                        y={cluster.y - cluster.height / 2 + 22}
                        textAnchor="end"
                      >
                        {cluster.leadIds.length} leads
                      </text>
                    </g>
                  );
                })}

                {graph.links.map((link) => {
                  const source = link.source as GraphNode;
                  const target = link.target as GraphNode;
                  if (source.x == null || source.y == null || target.x == null || target.y == null) return null;
                  const highlighted =
                    hoveredLeadId === target.leadId ||
                    hoveredClusterId === target.clusterId ||
                    (target.leadId != null && bulkSelected.has(target.leadId)) ||
                    target.leadId === selectedId;

                  return (
                    <line
                      key={link.id}
                      className={`discover-graph-link${highlighted ? ' highlighted' : ''}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                    />
                  );
                })}

                {leadNodes.map((node) => {
                  if (node.x == null || node.y == null) return null;
                  const lead = leadById.get(node.leadId);
                  const isSelected = node.leadId === selectedId;
                  const isBulk = bulkSelected.has(node.leadId);
                  const isHovered = hoveredLeadId === node.leadId;

                  return (
                    <g
                      key={node.id}
                      className="discover-graph-node"
                      transform={`translate(${node.x} ${node.y})`}
                      onMouseEnter={(event) => {
                        setHoveredLeadId(node.leadId);
                        setTooltip({ node, x: event.clientX, y: event.clientY });
                      }}
                      onMouseMove={(event) => {
                        setTooltip({ node, x: event.clientX, y: event.clientY });
                      }}
                      onMouseLeave={() => {
                        setHoveredLeadId(null);
                        setTooltip(null);
                      }}
                      onClick={(event) => selectLeadNode(node, event)}
                    >
                      {(isSelected || isBulk) && (
                        <circle
                          className="discover-graph-node-ring"
                          r={node.radius + 6}
                          style={{ stroke: isSelected ? 'var(--accent)' : 'var(--blue)' }}
                        />
                      )}
                      <circle
                        className={`discover-graph-node-circle${isHovered ? ' hovered' : ''}`}
                        r={node.radius}
                        style={{
                          fill: node.logoColor ?? '#57534e',
                          stroke: fitColor(node.score ?? 0),
                        }}
                      />
                      <text className="discover-graph-node-initials" dy="0.35em">
                        {node.initials}
                      </text>
                      <text className="discover-graph-node-score" y={node.radius + 14}>
                        {node.score}
                      </text>
                      {lead?.location && (
                        <title>{`${lead.name} · ${lead.score} fit · ${lead.location}`}</title>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            <div className="discover-graph-legend">
              <span className="discover-graph-legend-item">
                <span className="discover-graph-legend-dot high" /> High fit (75+)
              </span>
              <span className="discover-graph-legend-item">
                <span className="discover-graph-legend-dot promising" /> Promising (60–74)
              </span>
              <span className="discover-graph-legend-item">
                <span className="discover-graph-legend-dot review" /> Needs review (&lt;60)
              </span>
              <span className="discover-graph-legend-hint">
                Click cluster to select group · Shift+click to multi-select · Drag to pan
              </span>
            </div>
          </>
        )}
      </div>

      {tooltip && tooltip.node.leadId != null && (
        <div
          className="discover-graph-tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          {(() => {
            const lead = leadById.get(tooltip.node.leadId!);
            if (!lead) return null;
            return (
              <>
                <div className="discover-graph-tooltip-title">{lead.name}</div>
                <div className="discover-graph-tooltip-meta">
                  <Sparkles size={12} /> {lead.scoreLabel} · {lead.score} fit
                </div>
                <div className="discover-graph-tooltip-meta">
                  <MapPin size={12} /> {lead.location}
                </div>
                {lead.industry && <div className="discover-graph-tooltip-industry">{lead.industry}</div>}
              </>
            );
          })()}
        </div>
      )}

      {bulkSelected.size > 0 && (
        <div className="discover-graph-bulk card">
          <span className="discover-graph-bulk-count">
            {bulkSelected.size} lead{bulkSelected.size === 1 ? '' : 's'} selected for grouped action
          </span>
          <div className="discover-graph-bulk-actions">
            <button type="button" className="btn btn-outline btn-sm">
              <Bookmark size={14} /> Save all
            </button>
            <button type="button" className="btn btn-outline btn-sm">
              <CircleX size={14} /> Reject all
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                const firstId = [...bulkSelected][0];
                if (firstId != null) onDraftOutreach?.(firstId);
              }}
            >
              <Send size={14} /> Draft outreach
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearBulk}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
