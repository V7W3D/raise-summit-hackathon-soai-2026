import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Save } from 'lucide-react';
import { BusinessProfileCard } from './BusinessProfileCard';
import { ChipSelector } from './MissionChipSelector';
import {
  businessSizeOptions,
  missionPriorities,
  MISSION_PRIORITY_META,
  negativeFilterOptions,
  outreachChannels,
  OUTREACH_CHANNEL_LABELS,
  type MissionFormState,
} from './mission-constants';
import { buildCreatePayload, inferLanguageFromLocation, toggleChipSelection } from './mission-form-utils';
import {
  type MissionUpdatePayload,
  type MissionVM,
  useUpdateMission,
} from './use-missions-api-queries';
import { useBusinessProfile } from './use-business-profile-api-queries';

function missionToForm(mission: MissionVM): MissionFormState {
  return {
    selectedSegmentId: '',
    segmentLabel: mission.target,
    target: mission.target,
    location: mission.location,
    language: mission.language ?? 'fr',
    triggerSignals: mission.triggerSignals,
    buyerRoles: mission.buyerRoles,
    missionPriority: mission.missionPriority ?? 'fast_wins',
    negativeFilters: mission.negativeFilters,
    outreachChannel: mission.outreachChannel ?? 'mixed',
    targetBusinessSizes: mission.targetBusinessSize
      ? mission.targetBusinessSize.split(',').map((item) => item.trim()).filter(Boolean)
      : ['small'],
    desiredLeadCount: mission.desiredLeadCount ?? 25,
    customLeadCount: '',
    name: mission.name,
    nameManuallyEdited: true,
    prospectBrief: '',
    assistReasoning: '',
  };
}

function buildUpdatePayload(form: MissionFormState): MissionUpdatePayload | null {
  const createPayload = buildCreatePayload(form);
  if (!createPayload) return null;

  return {
    ...createPayload,
    description: undefined,
  };
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

  useEffect(() => {
    setForm(missionToForm(mission));
  }, [mission]);

  const updateField = <K extends keyof MissionFormState>(
    field: K,
    value: MissionFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = buildUpdatePayload(form);
    if (!payload) {
      setValidationError('Target, location, and mission name are required.');
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
          <span className="step-num">1</span> Business profile
        </div>
        {isProfilePending ? (
          <p className="mission-form-error">Loading business profile…</p>
        ) : isProfileError || !businessProfile ? (
          <p className="mission-form-error" role="alert">
            Business profile not found.
          </p>
        ) : (
          <BusinessProfileCard profile={businessProfile} />
        )}
      </div>

      <div className="create-step">
        <div className="create-step-head">
          <span className="step-num">2</span> Mission objective
        </div>
        <div className="mission-form-grid mission-form-grid-wide">
          <label className="mission-field mission-field-full">
            <span className="mission-field-label">Mission name</span>
            <input
              className="mission-input"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              maxLength={160}
              required
            />
          </label>
          <label className="mission-field">
            <span className="mission-field-label">Target type</span>
            <input
              className="mission-input"
              value={form.target}
              onChange={(event) => updateField('target', event.target.value)}
            />
          </label>
          <label className="mission-field">
            <span className="mission-field-label">Location</span>
            <input
              className="mission-input"
              value={form.location}
              onChange={(event) => {
                const location = event.target.value;
                updateField('location', location);
                updateField(
                  'language',
                  inferLanguageFromLocation(location, businessProfile?.languages),
                );
              }}
            />
          </label>
        </div>
      </div>

      <div className="create-step">
        <div className="create-step-head">
          <span className="step-num">3</span> Mode
        </div>
        <div className="mission-chip-group">
          <span className="mission-field-label">Priority</span>
          <div className="mission-chip-row">
            {missionPriorities.map((priority) => (
              <button
                key={priority}
                type="button"
                className={`mission-chip${form.missionPriority === priority ? ' selected' : ''}`}
                onClick={() => updateField('missionPriority', priority)}
              >
                {MISSION_PRIORITY_META[priority].label}
              </button>
            ))}
          </div>
        </div>

        <ChipSelector
          label="Negative filters"
          options={negativeFilterOptions}
          selected={form.negativeFilters}
          onChange={(selected) => updateField('negativeFilters', selected)}
        />

        <div className="mission-chip-group">
          <span className="mission-field-label">Preferred outreach</span>
          <div className="mission-chip-row">
            {outreachChannels.map((channel) => (
              <button
                key={channel}
                type="button"
                className={`mission-chip${form.outreachChannel === channel ? ' selected' : ''}`}
                onClick={() => updateField('outreachChannel', channel)}
              >
                {OUTREACH_CHANNEL_LABELS[channel]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="create-step" style={{ marginBottom: 0 }}>
        <div className="create-step-head">
          <span className="step-num">4</span> Filters
        </div>
        <p className="wizard-panel-subtitle" style={{ marginBottom: 12 }}>
          The agent runs freely — no fixed lead count.
        </p>
        <div className="mission-chip-group mission-chip-group-spaced">
          <span className="mission-field-label">Business size</span>
          <div className="mission-chip-row">
            {businessSizeOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`mission-chip${
                  form.targetBusinessSizes.includes(value) ? ' selected' : ''
                }`}
                aria-pressed={form.targetBusinessSizes.includes(value)}
                onClick={() =>
                  updateField(
                    'targetBusinessSizes',
                    toggleChipSelection(form.targetBusinessSizes, value),
                  )
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="create-note">
        <Info /> Changes update targeting for the next search run.
      </div>

      {(validationError || updateMission.isError) && (
        <p className="mission-form-error" role="alert">
          {validationError ?? mutationErrorMessage(updateMission.error)}
        </p>
      )}

      <div className="create-actions">
        <button type="button" className="btn btn-outline" onClick={() => navigate(`/missions/${mission.id}`)}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={updateMission.isPending || !businessProfile}>
          <Save size={16} /> {updateMission.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
