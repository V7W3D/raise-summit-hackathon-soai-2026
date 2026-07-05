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

      <h1 className="page-title">Launch a Prospecting Mission</h1>
      <p className="page-subtitle">
        Tell us who you want, where, and what matters most — we build the mission for you.
      </p>

      <div className="card create-mission-page">
        <CreateMissionForm />
      </div>
    </div>
  );
}
