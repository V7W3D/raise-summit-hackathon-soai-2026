import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { MissionDetailsContent } from './MissionDetailsContent';
import { useMission } from './use-missions-api-queries';
import './missions.css';

export function MissionDetailPage() {
  const { missionId } = useParams();
  const id = missionId ? Number(missionId) : NaN;
  const { data: mission, isPending, isError } = useMission(id);
  const isSearching = mission?.searchStatus === 'running';

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

      <div
        className={`card mission-detail-panel${isSearching ? ' mission-detail-panel-searching' : ''}`}
      >
        <MissionDetailsContent mission={mission} title="Mission overview" />
      </div>
    </div>
  );
}
