import { useRef } from 'react';
import {
  Plus,
  Filter,
  ArrowUpDown,
  ChevronDown,
  MapPin,
  Archive,
} from 'lucide-react';
import { ScoreRing } from '@components/ScoreRing';
import { CreateMissionPanel } from './CreateMissionPanel';
import { MissionOptionsMenu } from './MissionOptionsMenu';
import { useDeleteMission, useMissions } from './use-missions-api-queries';
import './missions.css';

export function MissionsPage() {
  const { data, isPending, isError } = useMissions();
  const deleteMission = useDeleteMission();
  const missions = data ?? [];
  const createPanelRef = useRef<HTMLDivElement>(null);

  if (isPending) {
    return <p className="page-subtitle">Loading…</p>;
  }

  if (isError) {
    return <p className="page-subtitle">Unable to load missions.</p>;
  }

  const scrollToCreateForm = () => {
    createPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="missions-layout">
      <div>
        <h1 className="page-title">Prospecting Missions</h1>
        <p className="page-subtitle">Create structured prospecting goals and manage your active missions.</p>

        <div className="missions-toolbar" style={{ justifyContent: 'flex-start' }}>
          <button type="button" className="btn btn-primary" onClick={scrollToCreateForm}>
            <Plus /> New mission
          </button>
        </div>

        <div className="missions-toolbar">
          <h2 className="section-title">Mission list</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="select-control">
              <Filter /> All statuses <ChevronDown />
            </button>
            <button type="button" className="select-control">
              <ArrowUpDown /> Last activity <ChevronDown />
            </button>
          </div>
        </div>

        {missions.map((mission) => (
          <div key={mission.id} className="card mission-card">
            <div className="mission-main">
              <div className="mission-name">{mission.name}</div>
              {mission.target ? <div className="mission-target">{mission.target}</div> : null}
              {mission.location ? (
                <div className="mission-tags">
                  <span className="mission-tag">
                    <MapPin /> {mission.location}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mission-actions">
              <span className={`pill pill-${mission.statusTone}`}>{mission.status}</span>
              <ScoreRing
                value={mission.progress}
                size={54}
                stroke={5}
                color="var(--accent)"
                fontSize={13}
                label={`${mission.progress}%`}
              />
              <MissionOptionsMenu
                missionId={mission.id}
                missionName={mission.name}
                onDelete={() => deleteMission.mutate(mission.id)}
                isDeleting={
                  deleteMission.isPending && deleteMission.variables === mission.id
                }
              />
            </div>
          </div>
        ))}

        <button type="button" className="missions-archived">
          <Archive size={16} /> View archived missions
        </button>
      </div>

      <div ref={createPanelRef}>
        <CreateMissionPanel />
      </div>
    </div>
  );
}
