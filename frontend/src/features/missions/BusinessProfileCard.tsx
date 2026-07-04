import { Link } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import type { BusinessProfileVM } from './use-business-profile-api-queries';

function displayList(values: string[]) {
  return values.length > 0 ? values.join(', ') : '—';
}

type BusinessProfileCardProps = {
  profile: BusinessProfileVM;
};

export function BusinessProfileCard({ profile }: BusinessProfileCardProps) {
  return (
    <div className="profile-card">
      <div className="profile-card-head">
        <CheckCircle2 size={16} /> Using your saved business profile
      </div>
      <div className="profile-grid">
        <div>
          <div className="profile-field-label">Business type</div>
          <div className="profile-field-value">{profile.businessType || '—'}</div>
        </div>
        <div>
          <div className="profile-field-label">Target market</div>
          <div className="profile-field-value">{displayList(profile.idealCustomers)}</div>
        </div>
        <div>
          <div className="profile-field-label">What you sell</div>
          <div className="profile-field-value">{profile.whatWeSell}</div>
        </div>
        <div>
          <div className="profile-field-label">Location</div>
          <div className="profile-field-value">{displayList(profile.targetGeographies)}</div>
        </div>
      </div>
      <div className="profile-foot">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Lock size={12} /> Configured once during onboarding and reused across missions.
        </span>
        <Link className="link" to="/profile" style={{ fontSize: '0.75rem' }}>
          Edit profile
        </Link>
      </div>
    </div>
  );
}
