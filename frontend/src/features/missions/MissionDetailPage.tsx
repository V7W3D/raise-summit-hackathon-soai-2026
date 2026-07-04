import { Link, useNavigate, useParams } from 'react-router-dom';
import { Archive, ArchiveRestore, ChevronLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import { MissionDetailsContent } from './MissionDetailsContent';
import { useDeleteMission, useMission, useUpdateMission } from './use-missions-api-queries';
import './missions.css';

export function MissionDetailPage() {
  const navigate = useNavigate();
  const { missionId } = useParams();
  const id = missionId ? Number(missionId) : NaN;
  const { data: mission, isPending, isError } = useMission(id);
  const deleteMission = useDeleteMission();
  const updateMission = useUpdateMission();
  const isSearching = mission?.searchStatus === 'running';
  const isDeleting = deleteMission.isPending && deleteMission.variables === id;
  const isArchiving = updateMission.isPending && updateMission.variables?.id === id;

  if (Number.isNaN(id)) {
    return <p className="page-subtitle">Invalid mission.</p>;
  }

  if (isPending) {
    return <p className="page-subtitle">Loading…</p>;
  }

  if (isError || !mission) {
    return (
      <div>
        <Link to="/missions" className="mission-back-link">
          <ChevronLeft size={16} /> Back to missions
        </Link>
        <p className="page-subtitle">Mission not found.</p>
      </div>
    );
  }

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete "${mission.name}"? All leads linked to this mission will also be removed.`,
    );
    if (!confirmed) return;

    deleteMission.mutate(id, {
      onSuccess: () => navigate('/missions'),
    });
  };

  const handleArchiveToggle = () => {
    const confirmed = mission.isArchived
      ? window.confirm(
          `Unarchive "${mission.name}"? It will appear in active missions again.`,
        )
      : window.confirm(
          `Archive "${mission.name}"? It will be hidden from active missions.`,
        );
    if (!confirmed) return;

    updateMission.mutate({ id, payload: { is_archived: !mission.isArchived } });
  };

  return (
    <div className="mission-detail-page">
      <Link to="/missions" className="mission-back-link">
        <ChevronLeft size={16} /> Back to missions
      </Link>

      <h1 className="page-title">{mission.name}</h1>
      <p className="page-subtitle">Review mission configuration and targeting criteria.</p>

      {isSearching ? (
        <div className="mission-search-banner" role="status">
          <Loader2 className="mission-search-spinner" size={16} aria-hidden />
          Agent is currently fetching leads for this mission…
        </div>
      ) : null}

      <div className="mission-detail-panel-wrapper">
        <div className="mission-detail-actions">
          <button
            type="button"
            className="btn btn-outline mission-detail-action"
            onClick={() => navigate(`/missions/${id}/edit`)}
            disabled={isSearching || isArchiving || isDeleting}
            title={isSearching ? 'Wait until the current search finishes' : undefined}
          >
            <Pencil size={15} />
            Edit mission
          </button>
          <button
            type="button"
            className="btn btn-outline mission-detail-action"
            onClick={handleArchiveToggle}
            disabled={isArchiving || isDeleting}
          >
            {mission.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            {isArchiving
              ? mission.isArchived
                ? 'Unarchiving…'
                : 'Archiving…'
              : mission.isArchived
                ? 'Unarchive mission'
                : 'Archive mission'}
          </button>
          <button
            type="button"
            className="btn btn-outline mission-detail-action mission-detail-action-danger"
            onClick={handleDelete}
            disabled={isDeleting || isArchiving}
          >
            <Trash2 size={15} />
            {isDeleting ? 'Deleting…' : 'Delete mission'}
          </button>
        </div>

        <div
          className={`card mission-detail-panel${isSearching ? ' mission-detail-panel-searching' : ''}`}
        >
          <MissionDetailsContent mission={mission} title="Mission overview" />
        </div>
      </div>
    </div>
  );
}
