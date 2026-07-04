import { CheckCircle2, Info, Lock } from 'lucide-react';
import { ScoreRing } from '@components/ScoreRing';
import type { MissionUrgency, MissionVM } from './use-missions-api-queries';

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
  return (
    <>
      <div className="mission-detail-header">
        <span className="create-panel-title">{title}</span>
        <div className="mission-detail-meta">
          <span className={`pill pill-${mission.statusTone}`}>{mission.status}</span>
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
        <div className="profile-card">
          <div className="profile-card-head">
            <CheckCircle2 size={16} /> Using your saved business profile
          </div>
          <div className="profile-grid">
            <div>
              <div className="profile-field-label">Business type</div>
              <div className="profile-field-value">B2B SaaS</div>
            </div>
            <div>
              <div className="profile-field-label">Target market</div>
              <div className="profile-field-value">Small local service companies</div>
            </div>
            <div>
              <div className="profile-field-label">What you sell</div>
              <div className="profile-field-value">AI phone receptionist</div>
            </div>
            <div>
              <div className="profile-field-label">Location</div>
              <div className="profile-field-value">France</div>
            </div>
          </div>
          <div className="profile-foot">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Lock size={12} /> Configured once during onboarding and reused across missions.
            </span>
            <a className="link" href="#profile" style={{ fontSize: '0.75rem' }}>
              Edit profile
            </a>
          </div>
        </div>
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
