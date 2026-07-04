import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { EditBusinessProfileForm } from './EditBusinessProfileForm';
import { useBusinessProfile } from './use-business-profile-api-queries';
import './missions.css';

export function EditBusinessProfilePage() {
  const { data: profile, isPending, isError } = useBusinessProfile();

  return (
    <div className="create-mission-page-wrap">
      <Link to="/missions/new" className="mission-back-link">
        <ChevronLeft size={16} /> Back
      </Link>

      <h1 className="page-title">Edit Business Profile</h1>
      <p className="page-subtitle">
        Update your company details and targeting preferences. Changes apply to all future missions.
      </p>

      <div className="card create-mission-page">
        {isPending ? (
          <p className="mission-form-error">Loading business profile…</p>
        ) : isError || !profile ? (
          <p className="mission-form-error" role="alert">
            Business profile not found. Run database seed before editing your profile.
          </p>
        ) : (
          <EditBusinessProfileForm profile={profile} />
        )}
      </div>
    </div>
  );
}
