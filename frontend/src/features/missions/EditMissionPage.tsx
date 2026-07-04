import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { EditMissionForm } from './EditMissionForm';
import { useMission } from './use-missions-api-queries';
import './missions.css';

export function EditMissionPage() {
  const { missionId } = useParams();
  const id = missionId ? Number(missionId) : NaN;
  const { data: mission, isPending, isError } = useMission(id);

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
    <div className="create-mission-page-wrap">
      <Link to={`/missions/${mission.id}`} className="mission-back-link">
        <ChevronLeft size={16} /> Back to mission
      </Link>

      <h1 className="page-title">Edit Mission</h1>
      <p className="page-subtitle">
        Update targeting criteria and success definition for &ldquo;{mission.name}&rdquo;.
      </p>

      <div className="card create-mission-page">
        <EditMissionForm mission={mission} />
      </div>
    </div>
  );
}
