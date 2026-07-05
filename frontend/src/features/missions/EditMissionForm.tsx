import axios from 'axios';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Save } from 'lucide-react';
import { BusinessProfileCard } from './BusinessProfileCard';
import {
  type MissionUpdatePayload,
  type MissionUrgency,
  type MissionVM,
  useUpdateMission,
} from './use-missions-api-queries';
import { useBusinessProfile } from './use-business-profile-api-queries';

const URGENCY_OPTIONS: { value: MissionUrgency; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

type MissionFormState = {
  name: string;
  target: string;
  location: string;
  description: string;
  targetIndustry: string;
  targetBusinessSize: string;
  desiredLeadCount: string;
  urgency: MissionUrgency | '';
  language: string;
};

function missionToForm(mission: MissionVM): MissionFormState {
  return {
    name: mission.name,
    target: mission.target,
    location: mission.location,
    description: mission.description,
    targetIndustry: mission.targetIndustry ?? '',
    targetBusinessSize: mission.targetBusinessSize ?? '',
    desiredLeadCount:
      mission.desiredLeadCount !== null ? String(mission.desiredLeadCount) : '',
    urgency: mission.urgency ?? '',
    language: mission.language ?? '',
  };
}

function buildPayload(form: MissionFormState): MissionUpdatePayload | null {
  const name = form.name.trim();
  if (!name) return null;

  const payload: MissionUpdatePayload = {
    name,
    target: form.target.trim(),
    location: form.location.trim(),
    description: form.description.trim(),
    target_industry: form.targetIndustry.trim() || null,
    target_business_size: form.targetBusinessSize.trim() || null,
    language: form.language.trim() || null,
    urgency: form.urgency || null,
  };

  const leadCountText = form.desiredLeadCount.trim();
  if (!leadCountText) {
    payload.desired_lead_count = null;
  } else {
    const leadCount = Number.parseInt(leadCountText, 10);
    if (Number.isNaN(leadCount) || leadCount < 1) return null;
    payload.desired_lead_count = leadCount;
  }

  return payload;
}

function mutationErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Unable to save mission. Please try again.';
  }
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  return 'Unable to save mission. Please try again.';
}

type EditMissionFormProps = {
  mission: MissionVM;
};

export function EditMissionForm({ mission }: EditMissionFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => missionToForm(mission));
  const [validationError, setValidationError] = useState<string | null>(null);
  const updateMission = useUpdateMission();
  const { data: businessProfile, isPending: isProfilePending, isError: isProfileError } =
    useBusinessProfile();
  const isSearching = mission.searchStatus === 'running';

  const updateField = <K extends keyof MissionFormState>(
    field: K,
    value: MissionFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = buildPayload(form);
    if (!payload) {
      setValidationError('Mission name is required. Desired lead count must be at least 1.');
      return;
    }

    updateMission.mutate(
      { id: mission.id, payload },
      {
        onSuccess: () => {
          navigate(`/missions/${mission.id}`);
        },
      },
    );
  };

  const handleCancel = () => {
    navigate(`/missions/${mission.id}`);
  };

  return (
    <form className="create-mission-form" onSubmit={handleSubmit}>
      {isSearching ? (
        <p className="mission-form-error" role="status">
          A search is currently running for this mission. You can still save changes, but new
          results may reflect the previous configuration.
        </p>
      ) : null}

      <div className="create-step">
        <div className="create-step-head">
          <span className="step-num">1</span> Use saved business profile
        </div>
        {isProfilePending ? (
          <p className="mission-form-error">Loading business profile…</p>
        ) : isProfileError || !businessProfile ? (
          <p className="mission-form-error" role="alert">
            Business profile not found. Run database seed before editing missions.
          </p>
        ) : (
          <BusinessProfileCard profile={businessProfile} />
        )}
      </div>

      <div className="create-step">
        <div className="create-step-head">
          <span className="step-num">2</span> Mission details
        </div>
        <div className="mission-form-grid mission-form-grid-wide">
          <label className="mission-field mission-field-full">
            <span className="mission-field-label">
              Mission name <span className="mission-field-required">*</span>
            </span>
            <input
              className="mission-input"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="e.g. Construction Clients – Lyon"
              maxLength={160}
              required
            />
          </label>
          <label className="mission-field">
            <span className="mission-field-label">Target</span>
            <input
              className="mission-input"
              value={form.target}
              onChange={(event) => updateField('target', event.target.value)}
              placeholder="e.g. small service businesses"
            />
          </label>
          <label className="mission-field">
            <span className="mission-field-label">Location</span>
            <input
              className="mission-input"
              value={form.location}
              onChange={(event) => updateField('location', event.target.value)}
              placeholder="e.g. Lyon, France"
            />
          </label>
          <label className="mission-field mission-field-full">
            <span className="mission-field-label">Description</span>
            <textarea
              className="mission-input mission-textarea"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Describe what this mission should achieve"
              rows={3}
              maxLength={500}
            />
          </label>
        </div>
      </div>

      <div className="create-step">
        <div className="create-step-head">
          <span className="step-num">3</span> Target criteria
        </div>
        <div className="mission-form-grid mission-form-grid-wide">
          <label className="mission-field">
            <span className="mission-field-label">Target industry</span>
            <input
              className="mission-input"
              value={form.targetIndustry}
              onChange={(event) => updateField('targetIndustry', event.target.value)}
              placeholder="e.g. construction"
              maxLength={120}
            />
          </label>
          <label className="mission-field">
            <span className="mission-field-label">Business size</span>
            <input
              className="mission-input"
              value={form.targetBusinessSize}
              onChange={(event) => updateField('targetBusinessSize', event.target.value)}
              placeholder="e.g. 10 – 100 employees"
              maxLength={120}
            />
          </label>
          <label className="mission-field">
            <span className="mission-field-label">Urgency</span>
            <select
              className="mission-input mission-select"
              value={form.urgency}
              onChange={(event) =>
                updateField('urgency', event.target.value as MissionUrgency | '')
              }
            >
              <option value="">Not set</option>
              {URGENCY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="mission-field">
            <span className="mission-field-label">Language</span>
            <input
              className="mission-input"
              value={form.language}
              onChange={(event) => updateField('language', event.target.value)}
              placeholder="e.g. fr"
              maxLength={10}
            />
          </label>
        </div>
      </div>

      <div className="create-step" style={{ marginBottom: 0 }}>
        <div className="create-step-head">
          <span className="step-num">4</span> Success definition
        </div>
        <div className="mission-form-grid mission-form-grid-wide">
          <label className="mission-field">
            <span className="mission-field-label">Desired lead count</span>
            <input
              className="mission-input"
              type="number"
              min={1}
              value={form.desiredLeadCount}
              onChange={(event) => updateField('desiredLeadCount', event.target.value)}
              placeholder="e.g. 10"
            />
          </label>
        </div>
      </div>

      <div className="create-note">
        <Info /> This profile is saved from onboarding and applied to every mission you create.
      </div>

      {(validationError || updateMission.isError) && (
        <p className="mission-form-error" role="alert">
          {validationError ?? mutationErrorMessage(updateMission.error)}
        </p>
      )}

      <div className="create-actions">
        <button type="button" className="btn btn-outline" onClick={handleCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={updateMission.isPending || !businessProfile}
        >
          <Save size={16} /> {updateMission.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
