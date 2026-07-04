import { Info } from 'lucide-react';
import { ScoreRing } from '@components/ScoreRing';
import { BusinessProfileCard } from './BusinessProfileCard';
import type { MissionUrgency, MissionVM } from './use-missions-api-queries';
import { useBusinessProfile } from './use-business-profile-api-queries';

const URGENCY_LABELS: Record<MissionUrgency, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '—';
  const text = String(value).trim();
  return text || '—';
}

type DetailFieldProps = {
  label: string;
  value: string | number | null | undefined;
  fullWidth?: boolean;
};

function DetailField({ label, value, fullWidth }: DetailFieldProps) {
  return (
    <div className={`mission-field${fullWidth ? ' mission-field-full' : ''}`}>
      <span className="mission-field-label">{label}</span>
      <div className="mission-detail-value">{displayValue(value)}</div>
    </div>
  );
}

type MissionDetailsContentProps = {
  mission: MissionVM;
  title?: string;
};

export function MissionDetailsContent({ mission, title = 'Mission details' }: MissionDetailsContentProps) {
  const { data: businessProfile, isPending: isProfilePending, isError: isProfileError } =
    useBusinessProfile();

  return (
    <>
      <div className="mission-detail-header">
        <span className="create-panel-title">{title}</span>
        <div className="mission-detail-meta">
          <ScoreRing
            value={mission.progress}
            size={54}
            stroke={5}
            color="var(--accent)"
            fontSize={13}
            label={`${mission.progress}%`}
          />
        </div>
      </div>

      <div className="create-step">
        <div className="create-step-head">
          <span className="step-num">1</span> Use saved business profile
        </div>
        {isProfilePending ? (
          <p className="mission-form-error">Loading business profile…</p>
        ) : isProfileError || !businessProfile ? (
          <p className="mission-form-error">Business profile not available.</p>
        ) : (
          <BusinessProfileCard profile={businessProfile} />
        )}
      </div>

      <div className="create-step">
        <div className="create-step-head">
          <span className="step-num">2</span> Mission details
        </div>
        <div className="mission-form-grid">
          <DetailField label="Mission name" value={mission.name} fullWidth />
          <DetailField label="Target" value={mission.target} />
          <DetailField label="Location" value={mission.location} />
          <DetailField label="Description" value={mission.description} fullWidth />
        </div>
      </div>

      <div className="create-step">
        <div className="create-step-head">
          <span className="step-num">3</span> Target criteria
        </div>
        <div className="mission-form-grid">
          <DetailField label="Target industry" value={mission.targetIndustry} />
          <DetailField label="Business size" value={mission.targetBusinessSize} />
          <DetailField
            label="Urgency"
            value={mission.urgency ? URGENCY_LABELS[mission.urgency] : null}
          />
          <DetailField label="Language" value={mission.language} />
        </div>
      </div>

      <div className="create-step" style={{ marginBottom: 0 }}>
        <div className="create-step-head">
          <span className="step-num">4</span> Success definition
        </div>
        <DetailField label="Desired lead count" value={mission.desiredLeadCount} />
      </div>

      <div className="create-note">
        <Info /> This profile is saved from onboarding and applied to every mission you create.
      </div>
    </>
  );
}
