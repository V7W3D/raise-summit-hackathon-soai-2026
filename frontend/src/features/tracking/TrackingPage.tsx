import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, MapPin, Kanban } from 'lucide-react';
import { useLeads } from '../discover/use-discover-api-queries';
import { useMissions } from '../missions/use-missions-api-queries';
import {
  useUpdateLeadTrackingStatus,
  type LeadVM,
  type TrackingStatus,
} from '../leads/use-leads-api-queries';
import {
  TRACKING_COLUMNS,
  countByTrackingStatus,
  filterTrackingLeads,
  groupLeadsByTrackingStatus,
  trackingColumnMeta,
} from './tracking-utils';
import './tracking.css';

const ALL_MISSIONS = -1;

function BrandDot({ bg, label }: { bg: string; label: string }) {
  return (
    <span
      className="tracking-card-avatar"
      style={{ background: bg }}
    >
      {label}
    </span>
  );
}

function TrackingLeadCard({
  lead,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  lead: LeadVM;
  isDragging: boolean;
  onDragStart: (leadId: number) => void;
  onDragEnd: () => void;
}) {
  const city = lead.location.split(',')[0]?.trim() ?? lead.location;

  return (
    <Link
      to={`/leads/${lead.id}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/lead-id', String(lead.id));
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(lead.id);
      }}
      onDragEnd={onDragEnd}
      onClick={(event) => {
        if (isDragging) event.preventDefault();
      }}
      className={`tracking-card${isDragging ? ' is-dragging' : ''}`}
      aria-label={`${lead.name}, ${trackingColumnMeta[lead.trackingStatus].label}`}
    >
      <div className="tracking-card-head">
        <BrandDot bg={lead.logoColor} label={lead.initials} />
        <span className="tracking-card-name">{lead.name}</span>
      </div>
      <div className="tracking-card-meta">
        <span className="tracking-card-location">
          <MapPin size={10} />
          {city || 'Unknown location'}
        </span>
        <span className="tracking-card-score">{lead.score}</span>
      </div>
    </Link>
  );
}

function TrackingColumn({
  status,
  leads,
  dragOverStatus,
  draggingLeadId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
}: {
  status: TrackingStatus;
  leads: LeadVM[];
  dragOverStatus: TrackingStatus | null;
  draggingLeadId: number | null;
  onDragOver: (status: TrackingStatus) => void;
  onDragLeave: () => void;
  onDrop: (status: TrackingStatus, leadId: number) => void;
  onDragStart: (leadId: number) => void;
  onDragEnd: () => void;
}) {
  const meta = trackingColumnMeta[status];

  return (
    <section
      className={`tracking-column tone-${meta.tone}${dragOverStatus === status ? ' is-over' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        onDragOver(status);
      }}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        event.preventDefault();
        const leadId = Number(event.dataTransfer.getData('text/lead-id'));
        if (!Number.isNaN(leadId)) onDrop(status, leadId);
      }}
      aria-label={`${meta.label} column`}
    >
      <header className="tracking-column-head">
        <div className="tracking-column-title">
          <span>{meta.label}</span>
          <span className="tracking-column-count">{leads.length}</span>
        </div>
        <span className="tracking-column-hint">{meta.hint}</span>
      </header>
      <div className="tracking-column-body">
        {leads.length === 0 ? (
          <div className="tracking-empty">Drop leads here</div>
        ) : (
          leads.map((lead) => (
            <TrackingLeadCard
              key={lead.id}
              lead={lead}
              isDragging={draggingLeadId === lead.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function TrackingPage() {
  const [searchParams] = useSearchParams();
  const [missionChoice, setMissionChoice] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TrackingStatus | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<number | null>(null);

  const { data: missions } = useMissions();
  const missionFromUrl = searchParams.get('mission');

  useEffect(() => {
    if (!missionFromUrl) return;
    const parsed = Number(missionFromUrl);
    if (!Number.isNaN(parsed)) {
      setMissionChoice(parsed);
    }
  }, [missionFromUrl]);

  const selectedMissionId = missionChoice ?? missions?.[0]?.id ?? ALL_MISSIONS;
  const activeMission = missions?.find((mission) => mission.id === selectedMissionId);

  const { data, isPending, isError } = useLeads({
    missionId: selectedMissionId === ALL_MISSIONS ? undefined : selectedMissionId,
  });

  const updateTrackingStatus = useUpdateLeadTrackingStatus();

  const trackingLeads = useMemo(() => filterTrackingLeads(data ?? []), [data]);
  const groupedLeads = useMemo(() => groupLeadsByTrackingStatus(trackingLeads), [trackingLeads]);
  const statusCounts = useMemo(() => countByTrackingStatus(trackingLeads), [trackingLeads]);

  const handleDrop = (status: TrackingStatus, leadId: number) => {
    setDragOverStatus(null);
    setDraggingLeadId(null);

    const lead = trackingLeads.find((item) => item.id === leadId);
    if (!lead || lead.trackingStatus === status) return;

    updateTrackingStatus.mutate({ id: leadId, trackingStatus: status });
  };

  if (isPending) {
    return <p className="page-subtitle">Loading…</p>;
  }

  if (isError) {
    return <p className="page-subtitle">Unable to load leads.</p>;
  }

  return (
    <div>
      <div className="tracking-header">
        <div>
          <h1 className="page-title">Track Leads</h1>
          <p className="page-subtitle">
            Drag approved leads across outreach stages as engagement evolves.
          </p>
        </div>
      </div>

      <div className="card mission-bar">
        <span className="icon-tile blue">
          <Building2 />
        </span>
        <div className="mission-bar-info">
          <span className="mission-bar-name">
            {activeMission ? activeMission.name : 'All missions'}
            {activeMission && <span className="mission-bar-dot" />}
          </span>
          {activeMission && (
            <span className="mission-bar-meta">
              {[activeMission.location, activeMission.target || activeMission.targetIndustry]
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}
        </div>
        <div className="mission-bar-stats">
          <span>
            <strong>{trackingLeads.length}</strong> approved
          </span>
          <span>
            <strong>{statusCounts.engaged + statusCounts.won}</strong> progressing
          </span>
        </div>
        <select
          className="select-control"
          value={selectedMissionId}
          onChange={(event) => setMissionChoice(Number(event.target.value))}
          aria-label="Filter by mission"
        >
          <option value={ALL_MISSIONS}>All missions</option>
          {(missions ?? []).map((mission) => (
            <option key={mission.id} value={mission.id}>
              {mission.name}
            </option>
          ))}
        </select>
      </div>

      {trackingLeads.length === 0 ? (
        <div className="card tracking-empty-state">
          <Kanban size={28} color="var(--faint)" />
          <p>
            No approved leads to track yet. Approve leads from{' '}
            <Link to="/discover" className="link">
              Discover
            </Link>{' '}
            or a mission verdict, then move them through outreach stages here.
          </p>
        </div>
      ) : (
        <div className="tracking-board">
          {TRACKING_COLUMNS.map((status) => (
            <TrackingColumn
              key={status}
              status={status}
              leads={groupedLeads[status]}
              dragOverStatus={dragOverStatus}
              draggingLeadId={draggingLeadId}
              onDragOver={setDragOverStatus}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={handleDrop}
              onDragStart={setDraggingLeadId}
              onDragEnd={() => {
                setDraggingLeadId(null);
                setDragOverStatus(null);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
