import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { CreateMissionForm } from './CreateMissionForm';
import './missions.css';

export function CreateMissionPage() {
  return (
    <div className="create-mission-page-wrap">
      <Link to="/missions" className="mission-back-link">
        <ChevronLeft size={16} /> Back to missions
      </Link>

      <h1 className="page-title">Create New Mission</h1>
      <p className="page-subtitle">
        Define a prospecting goal using your saved business profile and targeting criteria.
      </p>

      <div className="card create-mission-page">
        <CreateMissionForm />
      </div>
    </div>
  );
}
