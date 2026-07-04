import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowUpDown,
  ChevronDown,
  Archive,
  ChevronUp,
} from 'lucide-react';
import { MissionListItem } from './MissionListItem';
import {
  useDeleteMission,
  useMissions,
  useUpdateMission,
} from './use-missions-api-queries';
import './missions.css';

export function MissionsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: activeMissions, isPending, isError } = useMissions({ isArchived: false });
  const {
    data: archivedMissions,
    isPending: isArchivedPending,
    isError: isArchivedError,
  } = useMissions({ isArchived: true, enabled: showArchived });
  const deleteMission = useDeleteMission();
  const updateMission = useUpdateMission();
  const missions = activeMissions ?? [];
  const archived = archivedMissions ?? [];

  if (isPending) {
    return <p className="page-subtitle">Loading…</p>;
  }

  if (isError) {
    return <p className="page-subtitle">Unable to load missions.</p>;
  }

  return (
    <div className="missions-page">
      <h1 className="page-title">Prospecting Missions</h1>
      <p className="page-subtitle">Create structured prospecting goals and manage your active missions.</p>

      <div className="missions-toolbar" style={{ justifyContent: 'flex-start' }}>
        <Link to="/missions/new" className="btn btn-primary">
          <Plus /> New mission
        </Link>
      </div>

      <div className="missions-toolbar">
        <h2 className="section-title">Mission list</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="select-control">
            <ArrowUpDown /> Last activity <ChevronDown />
          </button>
        </div>
      </div>

      <div className="missions-list-scroll">
        {missions.length === 0 ? (
          <p className="missions-list-empty">No active missions yet.</p>
        ) : (
          missions.map((mission) => (
            <MissionListItem
              key={mission.id}
              mission={mission}
              onDelete={() => deleteMission.mutate(mission.id)}
              onArchive={() =>
                updateMission.mutate({ id: mission.id, payload: { is_archived: true } })
              }
              isDeleting={
                deleteMission.isPending && deleteMission.variables === mission.id
              }
              isArchiving={
                updateMission.isPending && updateMission.variables?.id === mission.id
              }
            />
          ))
        )}
      </div>

      <button
        type="button"
        className="missions-archived"
        onClick={() => setShowArchived((current) => !current)}
        aria-expanded={showArchived}
      >
        {showArchived ? <ChevronUp size={16} /> : <Archive size={16} />}
        {showArchived ? 'Hide archived missions' : 'View archived missions'}
      </button>

      {showArchived ? (
        <div className="missions-archived-section">
          <h3 className="missions-archived-title">Archived missions</h3>
          {isArchivedPending ? (
            <p className="missions-list-empty">Loading archived missions…</p>
          ) : isArchivedError ? (
            <p className="missions-list-empty">Unable to load archived missions.</p>
          ) : archived.length === 0 ? (
            <p className="missions-list-empty">No archived missions.</p>
          ) : (
            <div className="missions-list-scroll">
              {archived.map((mission) => (
                <MissionListItem
                  key={mission.id}
                  mission={mission}
                  archived
                  onDelete={() => deleteMission.mutate(mission.id)}
                  isDeleting={
                    deleteMission.isPending && deleteMission.variables === mission.id
                  }
                  isArchiving={false}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
