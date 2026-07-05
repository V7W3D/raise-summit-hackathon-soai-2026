import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  CircleX,
  Lightbulb,
  MapPin,
  Send,
  Sparkles,
  Target,
} from 'lucide-react';
import { fitColor } from '@components/ScoreRing';
import type { LeadVM } from '../../leads/use-leads-api-queries';
import {
  ACTION_SEGMENT_META,
  CLUSTER_MODE_LABELS,
  clusterColor,
  type ClusterMode,
} from '../discover-utils';
import { buildClusterGroups, buildOpportunityMap } from './build-opportunity-map';
import './discover-graph.css';

type DiscoverMapViewProps = {
  leads: LeadVM[];
  selectedId: number | null;
  onSelectLead: (id: number) => void;
  onSelectCluster?: (leadIds: number[]) => void;
  onDraftOutreach?: (leadId: number) => void;
};

export function DiscoverMapView({
  leads,
  selectedId,
  onSelectLead,
  onSelectCluster,
  onDraftOutreach,
}: DiscoverMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ width: 720, height: 360 });
  const [clusterMode, setClusterMode] = useState<ClusterMode>('action');
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [hoveredLeadId, setHoveredLeadId] = useState<number | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      if (width > 0) {
        setMapSize({ width, height: Math.min(420, Math.max(320, width * 0.45)) });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const leadById = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);

  const mapModel = useMemo(
    () => buildOpportunityMap(leads, mapSize.width, mapSize.height),
    [leads, mapSize.width, mapSize.height],
  );

  const segmentGroups = useMemo(() => {
    if (clusterMode === 'action') return mapModel.segments;
    return buildClusterGroups(leads, clusterMode);
  }, [clusterMode, leads, mapModel.segments]);

  const activeSegment =
    segmentGroups.find((segment) => segment.id === activeSegmentId) ??
    segmentGroups.find((segment) => segment.leadIds.includes(selectedId ?? -1)) ??
    segmentGroups[0] ??
    null;

  const highlightedLeadIds = useMemo(() => {
    if (activeSegment) return new Set(activeSegment.leadIds);
    return new Set<number>();
  }, [activeSegment]);

  const selectSegment = useCallback(
    (leadIds: number[], segmentId: string) => {
      setActiveSegmentId(segmentId);
      setBulkSelected(new Set(leadIds));
      onSelectCluster?.(leadIds);
      if (leadIds[0] != null) onSelectLead(leadIds[0]);
    },
    [onSelectCluster, onSelectLead],
  );

  const selectLead = (leadId: number) => {
    setBulkSelected(new Set());
    onSelectLead(leadId);
    const segment = segmentGroups.find((group) => group.leadIds.includes(leadId));
    if (segment) setActiveSegmentId(segment.id);
  };

  const clearBulk = () => {
    setBulkSelected(new Set());
    setActiveSegmentId(null);
    onSelectCluster?.([]);
  };

  return (
    <div className="discover-map">
      <div className="discover-map-header card">
        <div className="discover-map-header-copy">
          <Target size={18} />
          <div>
            <strong>Opportunity map</strong>
          </div>
        </div>

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
      </div>

      {leads.length === 0 ? (
        <div className="discover-graph-empty card">
          <Sparkles size={28} />
          <p>No leads to map in this tab.</p>
        </div>
      ) : (
        <div className="discover-map-layout">
          <div ref={mapRef} className="discover-map-canvas card">
            <svg
              className="discover-map-svg"
              width={mapModel.width}
              height={mapModel.height}
              viewBox={`0 0 ${mapModel.width} ${mapModel.height}`}
            >
              <defs>
                <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--border)" strokeWidth="0.5" />
                </pattern>
              </defs>

              <rect width="100%" height="100%" fill="url(#map-grid)" />

              <rect
                className="discover-map-quadrant contact-first"
                x={mapModel.padding + mapModel.width * 0.35}
                y={mapModel.padding}
                width={mapModel.width - mapModel.padding * 2 - mapModel.width * 0.35}
                height={(mapModel.height - mapModel.padding * 2) * 0.45}
                rx={12}
              />
              <rect
                className="discover-map-quadrant enrich-first"
                x={mapModel.padding}
                y={mapModel.padding}
                width={mapModel.width * 0.35}
                height={(mapModel.height - mapModel.padding * 2) * 0.45}
                rx={12}
              />

              <text className="discover-map-axis-label" x={mapModel.padding} y={24}>
                Fit score ↑
              </text>
              <text
                className="discover-map-axis-label"
                x={mapModel.width - mapModel.padding}
                y={mapModel.height - 12}
                textAnchor="end"
              >
                Contactability →
              </text>

              <text className="discover-map-quadrant-label" x={mapModel.width - mapModel.padding - 12} y={mapModel.padding + 18} textAnchor="end">
                Contact first
              </text>
              <text className="discover-map-quadrant-label" x={mapModel.padding + 12} y={mapModel.padding + 18}>
                Enrich first
              </text>

              {mapModel.points.map((point) => {
                const lead = leadById.get(point.leadId);
                if (!lead) return null;

                const isSelected = point.leadId === selectedId;
                const isBulk = bulkSelected.has(point.leadId);
                const isHovered = hoveredLeadId === point.leadId;
                const isDimmed =
                  activeSegment != null &&
                  !highlightedLeadIds.has(point.leadId) &&
                  !isSelected &&
                  !isBulk;
                const meta = ACTION_SEGMENT_META[point.segmentId];

                return (
                  <g
                    key={point.leadId}
                    className={`discover-map-point${isDimmed ? ' dimmed' : ''}`}
                    transform={`translate(${point.x} ${point.y})`}
                    onMouseEnter={() => setHoveredLeadId(point.leadId)}
                    onMouseLeave={() => setHoveredLeadId(null)}
                    onClick={() => selectLead(point.leadId)}
                  >
                    {(isSelected || isBulk) && (
                      <circle
                        className="discover-map-point-ring"
                        r={point.radius + 5}
                        style={{ stroke: isSelected ? 'var(--accent)' : meta.color }}
                      />
                    )}
                    <circle
                      className={`discover-map-point-circle${isHovered ? ' hovered' : ''}`}
                      r={point.radius}
                      style={{
                        fill: lead.logoColor,
                        stroke: fitColor(point.score),
                        opacity: isDimmed ? 0.28 : 1,
                      }}
                    />
                    <text className="discover-map-point-initials" dy="0.35em">
                      {lead.initials}
                    </text>
                    <title>
                      {`${lead.name} · ${point.score} fit · ${point.contactability}% contactable · ${meta.label}`}
                    </title>
                  </g>
                );
              })}
            </svg>

            <div className="discover-map-legend">
              <span>Size = fit priority</span>
              <span>Right = easier to reach</span>
              <span>Top = stronger fit</span>
            </div>
          </div>

          <div className="discover-map-segments">
            {segmentGroups.map((segment) => {
              const isActive = activeSegment?.id === segment.id && activeSegment.label === segment.label;
              const readyCount = segment.contactableCount;

              return (
                <button
                  key={`${segment.id}-${segment.label}`}
                  type="button"
                  className={`discover-segment-card card${isActive ? ' active' : ''}`}
                  onClick={() => selectSegment(segment.leadIds, segment.id)}
                >
                  <div className="discover-segment-card-head">
                    <span
                      className="discover-segment-dot"
                      style={{ background: segment.color ?? clusterColor(segment.label, clusterMode) }}
                    />
                    <div className="discover-segment-title-wrap">
                      <strong>{segment.label}</strong>
                      <span>{segment.leads.length} leads · avg {segment.avgScore}</span>
                    </div>
                    <span className="discover-segment-playbook">{segment.playbook}</span>
                  </div>

                  <p className="discover-segment-explanation">
                    <Lightbulb size={14} />
                    {segment.explanation}
                  </p>

                  <div className="discover-segment-meta">
                    {readyCount > 0 ? (
                      <span>{readyCount} contactable</span>
                    ) : (
                      <span>Needs enrichment</span>
                    )}
                    {segment.topGap ? <span>Top gap: {segment.topGap}</span> : null}
                  </div>

                  <div className="discover-segment-preview">
                    {segment.leads.slice(0, 3).map((lead) => (
                      <span key={lead.id} className="discover-segment-lead-chip">
                        {lead.initials} {lead.name.split(' ')[0]}
                      </span>
                    ))}
                    {segment.leads.length > 3 ? (
                      <span className="discover-segment-lead-chip muted">+{segment.leads.length - 3}</span>
                    ) : null}
                  </div>

                  <span className="discover-segment-action">
                    Select segment <ArrowRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hoveredLeadId != null && leadById.get(hoveredLeadId) ? (
        <div className="discover-map-hover card">
          {(() => {
            const lead = leadById.get(hoveredLeadId)!;
            return (
              <>
                <strong>{lead.name}</strong>
                <span>
                  <Sparkles size={12} /> {lead.score} fit · {lead.contactBadge}
                </span>
                <span>
                  <MapPin size={12} /> {lead.location}
                </span>
                {lead.recommended[0] ? <em>{lead.recommended[0]}</em> : null}
              </>
            );
          })()}
        </div>
      ) : null}

      {bulkSelected.size > 0 && (
        <div className="discover-graph-bulk card">
          <span className="discover-graph-bulk-count">
            {bulkSelected.size} lead{bulkSelected.size === 1 ? '' : 's'} in{' '}
            {activeSegment?.label ?? 'segment'}
          </span>
          <div className="discover-graph-bulk-actions">
            <button type="button" className="btn btn-outline btn-sm">
              <Bookmark size={14} /> Save segment
            </button>
            <button type="button" className="btn btn-outline btn-sm">
              <CircleX size={14} /> Reject segment
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                const firstId = [...bulkSelected][0];
                if (firstId != null) onDraftOutreach?.(firstId);
              }}
            >
              <Send size={14} /> {activeSegment?.playbook ?? 'Draft outreach'}
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
