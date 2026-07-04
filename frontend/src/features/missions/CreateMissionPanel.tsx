import axios from 'axios';
import { useState, type FormEvent } from 'react';
import { Bell, CheckCircle2, Info, Lock, Target } from 'lucide-react';
import {
  type MissionCreatePayload,
  type MissionUrgency,
  useCreateMission,
} from './use-missions-api-queries';

const URGENCY_OPTIONS: { value: MissionUrgency; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const INITIAL_FORM = {
  name: '',
  target: '',
  location: '',
  description: '',
  targetIndustry: '',
  targetBusinessSize: '',
  desiredLeadCount: '',
  urgency: '' as MissionUrgency | '',
  language: '',
};

function buildPayload(form: typeof INITIAL_FORM): MissionCreatePayload | null {
  const name = form.name.trim();
  if (!name) return null;

  const payload: MissionCreatePayload = {
    name,
    status: 'Draft',
  };

  const target = form.target.trim();
  if (target) payload.target = target;

  const location = form.location.trim();
  if (location) payload.location = location;

  const description = form.description.trim();
  if (description) payload.description = description;

  const targetIndustry = form.targetIndustry.trim();
  if (targetIndustry) payload.target_industry = targetIndustry;

  const targetBusinessSize = form.targetBusinessSize.trim();
  if (targetBusinessSize) payload.target_business_size = targetBusinessSize;

  const language = form.language.trim();
  if (language) payload.language = language;

  if (form.urgency) payload.urgency = form.urgency;

  const leadCount = Number.parseInt(form.desiredLeadCount, 10);
  if (!Number.isNaN(leadCount) && leadCount >= 1) {
    payload.desired_lead_count = leadCount;
  }

  return payload;
}

function mutationErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Unable to create mission. Please try again.';
  }
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  return 'Unable to create mission. Please try again.';
}

export function CreateMissionPanel() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);
  const createMission = useCreateMission();

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setValidationError(null);
    createMission.reset();
  };

  const updateField = <K extends keyof typeof INITIAL_FORM>(
    field: K,
    value: (typeof INITIAL_FORM)[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = buildPayload(form);
    if (!payload) {
      setValidationError('Mission name is required.');
      return;
    }

    createMission.mutate(payload, {
      onSuccess: () => resetForm(),
    });
  };

  return (
    <aside className="card create-panel">
      <form onSubmit={handleSubmit}>
        <div className="create-panel-head">
          <span className="create-panel-title">Create New Mission</span>
          <button type="button" className="icon-btn notif-btn" aria-label="Notifications">
            <Bell size={18} />
          </button>
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
                placeholder="Optional — auto-generated from name and target if left empty"
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
          <div className="mission-form-grid">
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

        <div className="create-note">
          <Info /> This profile is saved from onboarding and applied to every mission you create.
        </div>

        {(validationError || createMission.isError) && (
          <p className="mission-form-error" role="alert">
            {validationError ?? mutationErrorMessage(createMission.error)}
          </p>
        )}

        <div className="create-actions">
          <button type="button" className="btn btn-outline" onClick={resetForm}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={createMission.isPending}>
            <Target size={16} /> {createMission.isPending ? 'Creating…' : 'Create mission'}
          </button>
        </div>
      </form>
    </aside>
  );
}
