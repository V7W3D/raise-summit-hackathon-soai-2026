import { Info } from 'lucide-react';
import { ScoreRing } from '@components/ScoreRing';
import { BusinessProfileCard } from './BusinessProfileCard';
import { MISSION_PRIORITY_META, OUTREACH_CHANNEL_LABELS } from './mission-constants';
import type { MissionVM } from './use-missions-api-queries';
import { useBusinessProfile } from './use-business-profile-api-queries';

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '—';
  const text = String(value).trim();
  return text || '—';
}

function TagList({ items }: { items: string[] }) {
  if (!items.length) {
    return <div className="mission-detail-value">—</div>;
  }
  return (
    <div className="mission-tag-list">
      {items.map((item) => (
        <span key={item} className="mission-tag">
          {item}
        </span>
      ))}
    </div>
  );
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

  const priorityLabel = mission.missionPriority
    ? MISSION_PRIORITY_META[mission.missionPriority].label
    : null;

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
          <span className="step-num">1</span> Business profile
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
          <span className="step-num">2</span> Mission objective
        </div>
        <div className="mission-form-grid">
          <DetailField label="Mission name" value={mission.name} fullWidth />
          <DetailField label="Target type" value={mission.target} />
          <DetailField label="Location" value={mission.location} />
          <DetailField label="Language" value={mission.language} />
          <DetailField label="Description" value={mission.description} fullWidth />
        </div>
      </div>

      <div className="create-step">
        <div className="create-step-head">
          <span className="step-num">3</span> Mode
        </div>
        <div className="mission-form-grid">
          <DetailField label="Priority" value={priorityLabel} />
          <DetailField
            label="Outreach channel"
            value={mission.outreachChannel ? OUTREACH_CHANNEL_LABELS[mission.outreachChannel] : null}
          />
          <DetailField label="Business size" value={mission.targetBusinessSize} />
          <div className="mission-field mission-field-full">
            <span className="mission-field-label">Negative filters</span>
            <TagList items={mission.negativeFilters} />
          </div>
        </div>
      </div>

      <div className="create-step" style={{ marginBottom: 0 }}>
        <div className="create-step-head">
          <span className="step-num">4</span> Goal
        </div>
        <DetailField label="Desired lead count" value={mission.desiredLeadCount} />
      </div>

      <div className="create-note">
        <Info /> This mission packages one prospecting objective with clear targeting and output.
      </div>
    </>
  );
}
