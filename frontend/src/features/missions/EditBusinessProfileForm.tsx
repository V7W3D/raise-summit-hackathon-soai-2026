import axios from 'axios';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import {
  type BusinessProfileUpdatePayload,
  type BusinessProfileVM,
  useUpdateBusinessProfile,
} from './use-business-profile-api-queries';

type ProfileFormState = {
  businessName: string;
  businessType: string;
  description: string;
  whatWeSell: string;
  valueProposition: string;
  targetGeographies: string;
  idealCustomers: string;
  badFitCustomers: string;
  preferredTone: string;
  languages: string;
};

function joinList(values: string[]) {
  return values.join(', ');
}

function parseList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function profileToForm(profile: BusinessProfileVM): ProfileFormState {
  return {
    businessName: profile.businessName,
    businessType: profile.businessType ?? '',
    description: profile.description ?? '',
    whatWeSell: profile.whatWeSell,
    valueProposition: profile.valueProposition ?? '',
    targetGeographies: joinList(profile.targetGeographies),
    idealCustomers: joinList(profile.idealCustomers),
    badFitCustomers: joinList(profile.badFitCustomers),
    preferredTone: profile.preferredTone ?? '',
    languages: joinList(profile.languages),
  };
}

function buildPayload(form: ProfileFormState): BusinessProfileUpdatePayload | null {
  const businessName = form.businessName.trim();
  const whatWeSell = form.whatWeSell.trim();
  if (!businessName || !whatWeSell) return null;

  const payload: BusinessProfileUpdatePayload = {
    business_name: businessName,
    what_we_sell: whatWeSell,
    target_geographies: parseList(form.targetGeographies),
    ideal_customers: parseList(form.idealCustomers),
    bad_fit_customers: parseList(form.badFitCustomers),
    languages: parseList(form.languages),
  };

  const businessType = form.businessType.trim();
  payload.business_type = businessType || null;

  const description = form.description.trim();
  payload.description = description || null;

  const valueProposition = form.valueProposition.trim();
  payload.value_proposition = valueProposition || null;

  const preferredTone = form.preferredTone.trim();
  payload.preferred_tone = preferredTone || null;

  return payload;
}

function mutationErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Unable to save business profile. Please try again.';
  }
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  return 'Unable to save business profile. Please try again.';
}

type EditBusinessProfileFormProps = {
  profile: BusinessProfileVM;
};

export function EditBusinessProfileForm({ profile }: EditBusinessProfileFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => profileToForm(profile));
  const [validationError, setValidationError] = useState<string | null>(null);
  const updateProfile = useUpdateBusinessProfile();

  const updateField = <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = buildPayload(form);
    if (!payload) {
      setValidationError('Business name and what you sell are required.');
      return;
    }

    updateProfile.mutate(payload, {
      onSuccess: () => {
        navigate('/missions/new');
      },
    });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <form className="create-mission-form" onSubmit={handleSubmit}>
      <div className="create-step">
        <div className="create-step-head">Company details</div>
        <div className="mission-form-grid mission-form-grid-wide">
          <label className="mission-field">
            <span className="mission-field-label">
              Business name <span className="mission-field-required">*</span>
            </span>
            <input
              className="mission-input"
              value={form.businessName}
              onChange={(event) => updateField('businessName', event.target.value)}
              placeholder="e.g. CallPilot AI"
              maxLength={160}
              required
            />
          </label>
          <label className="mission-field">
            <span className="mission-field-label">Business type</span>
            <input
              className="mission-input"
              value={form.businessType}
              onChange={(event) => updateField('businessType', event.target.value)}
              placeholder="e.g. B2B SaaS"
              maxLength={120}
            />
          </label>
          <label className="mission-field mission-field-full">
            <span className="mission-field-label">Description</span>
            <textarea
              className="mission-input mission-textarea"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Brief overview of your business"
              rows={3}
              maxLength={500}
            />
          </label>
        </div>
      </div>

      <div className="create-step">
        <div className="create-step-head">Offering</div>
        <div className="mission-form-grid mission-form-grid-wide">
          <label className="mission-field mission-field-full">
            <span className="mission-field-label">
              What you sell <span className="mission-field-required">*</span>
            </span>
            <textarea
              className="mission-input mission-textarea"
              value={form.whatWeSell}
              onChange={(event) => updateField('whatWeSell', event.target.value)}
              placeholder="e.g. AI phone receptionist for small service businesses"
              rows={2}
              maxLength={500}
              required
            />
          </label>
          <label className="mission-field mission-field-full">
            <span className="mission-field-label">Value proposition</span>
            <textarea
              className="mission-input mission-textarea"
              value={form.valueProposition}
              onChange={(event) => updateField('valueProposition', event.target.value)}
              placeholder="Why customers choose you"
              rows={2}
              maxLength={500}
            />
          </label>
        </div>
      </div>

      <div className="create-step">
        <div className="create-step-head">Targeting</div>
        <div className="mission-form-grid mission-form-grid-wide">
          <label className="mission-field">
            <span className="mission-field-label">Target geographies</span>
            <input
              className="mission-input"
              value={form.targetGeographies}
              onChange={(event) => updateField('targetGeographies', event.target.value)}
              placeholder="e.g. France, Europe"
            />
          </label>
          <label className="mission-field">
            <span className="mission-field-label">Ideal customers</span>
            <input
              className="mission-input"
              value={form.idealCustomers}
              onChange={(event) => updateField('idealCustomers', event.target.value)}
              placeholder="Comma-separated segments"
            />
          </label>
          <label className="mission-field mission-field-full">
            <span className="mission-field-label">Bad-fit customers</span>
            <input
              className="mission-input"
              value={form.badFitCustomers}
              onChange={(event) => updateField('badFitCustomers', event.target.value)}
              placeholder="Comma-separated segments to avoid"
            />
          </label>
        </div>
      </div>

      <div className="create-step" style={{ marginBottom: 0 }}>
        <div className="create-step-head">Outreach preferences</div>
        <div className="mission-form-grid mission-form-grid-wide">
          <label className="mission-field">
            <span className="mission-field-label">Preferred tone</span>
            <input
              className="mission-input"
              value={form.preferredTone}
              onChange={(event) => updateField('preferredTone', event.target.value)}
              placeholder="e.g. professional, friendly"
              maxLength={120}
            />
          </label>
          <label className="mission-field">
            <span className="mission-field-label">Languages</span>
            <input
              className="mission-input"
              value={form.languages}
              onChange={(event) => updateField('languages', event.target.value)}
              placeholder="e.g. fr, en"
            />
          </label>
        </div>
      </div>

      {(validationError || updateProfile.isError) && (
        <p className="mission-form-error" role="alert">
          {validationError ?? mutationErrorMessage(updateProfile.error)}
        </p>
      )}

      <div className="create-actions">
        <button type="button" className="btn btn-outline" onClick={handleCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={updateProfile.isPending}>
          <Save size={16} /> {updateProfile.isPending ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  );
}
