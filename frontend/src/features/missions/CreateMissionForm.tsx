import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { BusinessProfileCard } from './BusinessProfileCard';
import { ChipSelector, OptionCard } from './MissionChipSelector';
import { TargetKeywordPicker } from './TargetKeywordPicker';
import {
  businessSizeOptions,
  DIFFICULTY_LABELS,
  INITIAL_MISSION_FORM,
  languageOptions,
  leadCountPresets,
  MISSION_PRIORITY_META,
  missionPriorities,
  negativeFilterOptions,
  OUTREACH_CHANNEL_LABELS,
  outreachChannels,
  WIZARD_STEPS,
  type MissionFormState,
  type WizardStepId,
} from './mission-constants';
import {
  addTargetKeyword,
  buildCreatePayload,
  canAdvanceFromStep,
  defaultLocationFromProfile,
  formToPreviewPayload,
  inferLanguageFromLocation,
  removeTargetKeyword,
} from './mission-form-utils';
import {
  useCreateMission,
  useMissionPreview,
  useTargetKeywords,
  type MissionPreviewVM,
} from './use-missions-api-queries';
import { useBusinessProfile } from './use-business-profile-api-queries';

function mutationErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Unable to create mission. Please try again.';
  }
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  return 'Unable to create mission. Please try again.';
}

export function CreateMissionForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStepId>('what');
  const [form, setForm] = useState<MissionFormState>(INITIAL_MISSION_FORM);
  const [preview, setPreview] = useState<MissionPreviewVM | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [keywordsLoaded, setKeywordsLoaded] = useState(false);

  const createMission = useCreateMission();
  const previewMission = useMissionPreview();
  const { data: businessProfile, isPending: isProfilePending, isError: isProfileError } =
    useBusinessProfile();
  const {
    data: targetKeywords,
    isPending: isKeywordsPending,
    isError: isKeywordsError,
  } = useTargetKeywords(Boolean(businessProfile));

  useEffect(() => {
    if (!businessProfile || initialized) return;
    const location = defaultLocationFromProfile(businessProfile);
    const language = inferLanguageFromLocation(location, businessProfile.languages);
    setForm((current) => ({
      ...current,
      location: location || current.location,
      language,
    }));
    setInitialized(true);
  }, [businessProfile, initialized]);

  useEffect(() => {
    if (!targetKeywords || keywordsLoaded) return;
    setForm((current) => ({
      ...current,
      targetKeywords: targetKeywords.keywords,
      target: current.target || targetKeywords.keywords[0] || '',
    }));
    setKeywordsLoaded(true);
  }, [targetKeywords, keywordsLoaded]);

  useEffect(() => {
    if (!form.target.trim() || !form.location.trim()) {
      setPreview(null);
      return;
    }

    const timer = window.setTimeout(() => {
      previewMission.mutate(formToPreviewPayload(form), {
        onSuccess: (result) => {
          setPreview(result);
          if (!form.nameManuallyEdited) {
            setForm((current) => ({ ...current, name: result.suggestedName }));
          }
        },
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [
    form.target,
    form.location,
    form.targetBusinessSize,
    form.missionPriority,
    form.negativeFilters,
    form.outreachChannel,
    form.desiredLeadCount,
    form.customLeadCount,
    form.nameManuallyEdited,
    form.language,
  ]);

  const updateForm = <K extends keyof MissionFormState>(
    field: K,
    value: MissionFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  };

  const handleAddKeyword = (keyword: string) => {
    setForm((current) => {
      const targetKeywords = addTargetKeyword(current.targetKeywords, keyword);
      const target =
        current.target && targetKeywords.some((item) => item.toLowerCase() === current.target.toLowerCase())
          ? current.target
          : keyword;
      return { ...current, targetKeywords, target };
    });
  };

  const handleRemoveKeyword = (keyword: string) => {
    setForm((current) => {
      const targetKeywords = removeTargetKeyword(current.targetKeywords, keyword);
      const removedCurrent = current.target.toLowerCase() === keyword.toLowerCase();
      return {
        ...current,
        targetKeywords,
        target: removedCurrent ? (targetKeywords[0] ?? '') : current.target,
      };
    });
  };

  const stepIndex = WIZARD_STEPS.findIndex((item) => item.id === step);

  const goNext = () => {
    if (!canAdvanceFromStep(step, form)) {
      setValidationError('Pick a target keyword and set a location before continuing.');
      return;
    }
    const next = WIZARD_STEPS[stepIndex + 1];
    if (next) setStep(next.id);
    setValidationError(null);
  };

  const goBack = () => {
    const prev = WIZARD_STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
    setValidationError(null);
  };

  const handleSubmit = () => {
    const payload = buildCreatePayload(form);
    if (!payload) {
      setValidationError('Target, location, and mission name are required.');
      return;
    }

    createMission.mutate(payload, {
      onSuccess: (mission) => {
        navigate(`/missions/${mission.id}?run=1`);
      },
    });
  };

  return (
    <div className="create-mission-form">
      <div className="create-step">
        <div className="create-step-head">
          <span className="step-num">✓</span> Saved business profile
        </div>
        {isProfilePending ? (
          <p className="mission-form-error">Loading business profile…</p>
        ) : isProfileError || !businessProfile ? (
          <p className="mission-form-error" role="alert">
            Business profile not found. Run database seed before creating missions.
          </p>
        ) : (
          <BusinessProfileCard profile={businessProfile} />
        )}
      </div>

      <div className="wizard-progress" aria-label="Mission creation progress">
        {WIZARD_STEPS.map((wizardStep, index) => (
          <div
            key={wizardStep.id}
            className={`wizard-progress-step${index <= stepIndex ? ' active' : ''}${index === stepIndex ? ' current' : ''}`}
          >
            <span className="wizard-progress-num">{index + 1}</span>
            <span className="wizard-progress-label">{wizardStep.label}</span>
          </div>
        ))}
      </div>

      {preview && step !== 'what' ? (
        <div className="mission-live-summary">
          <Sparkles size={16} />
          <p>{preview.summary}</p>
        </div>
      ) : null}

      {step === 'what' ? (
        <section className="wizard-panel">
          <h2 className="wizard-panel-title">What are you looking for?</h2>
          <p className="wizard-panel-subtitle">
            Pick your target from AI-suggested keywords — add or remove words as you go.
          </p>

          <TargetKeywordPicker
            keywords={form.targetKeywords}
            selected={form.target}
            onSelect={(keyword) => updateForm('target', keyword)}
            onAdd={handleAddKeyword}
            onRemove={handleRemoveKeyword}
            isLoading={isKeywordsPending && !keywordsLoaded}
            source={targetKeywords?.source}
          />

          {isKeywordsError ? (
            <p className="mission-form-error" role="alert">
              Could not load AI keywords. Add your own targets to continue.
            </p>
          ) : null}

          <label className="mission-field mission-field-full">
            <span className="mission-field-label">Location</span>
            <input
              className="mission-input"
              value={form.location}
              onChange={(event) => {
                const location = event.target.value;
                updateForm('location', location);
                updateForm(
                  'language',
                  inferLanguageFromLocation(location, businessProfile?.languages),
                );
              }}
              placeholder="e.g. Lyon, France"
            />
          </label>

          <div className="mission-chip-group">
            <span className="mission-field-label">Language</span>
            <div className="mission-chip-row">
              {languageOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`mission-chip${form.language === value ? ' selected' : ''}`}
                  onClick={() => updateForm('language', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {step === 'priority' ? (
        <section className="wizard-panel">
          <h2 className="wizard-panel-title">How should this mission run?</h2>
          <p className="wizard-panel-subtitle">
            Pick a mode, what to exclude, and how you plan to reach out.
          </p>

          <div className="mission-option-grid">
            {missionPriorities.map((priority) => {
              const meta = MISSION_PRIORITY_META[priority];
              return (
                <OptionCard
                  key={priority}
                  label={meta.label}
                  description={meta.description}
                  selected={form.missionPriority === priority}
                  onSelect={() => updateForm('missionPriority', priority)}
                />
              );
            })}
          </div>

          {form.missionPriority ? (
            <p className="mission-priority-effect">
              <Info size={14} /> {MISSION_PRIORITY_META[form.missionPriority].urgencyEffect}
            </p>
          ) : null}

          <ChipSelector
            label="Negative filters"
            hint="Exclude noise upfront"
            options={negativeFilterOptions}
            selected={form.negativeFilters}
            onChange={(selected) => updateForm('negativeFilters', selected)}
          />

          <div className="mission-chip-group">
            <span className="mission-field-label">Preferred outreach</span>
            <div className="mission-chip-row">
              {outreachChannels.map((channel) => (
                <button
                  key={channel}
                  type="button"
                  className={`mission-chip${form.outreachChannel === channel ? ' selected' : ''}`}
                  onClick={() => updateForm('outreachChannel', channel)}
                >
                  {OUTREACH_CHANNEL_LABELS[channel]}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {step === 'goal' ? (
        <section className="wizard-panel">
          <h2 className="wizard-panel-title">How many leads do you want?</h2>
          <p className="wizard-panel-subtitle">Pick a preset or enter a custom count.</p>

          <div className="mission-chip-group">
            <span className="mission-field-label">Lead count</span>
            <div className="mission-chip-row">
              {leadCountPresets.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`mission-chip mission-chip-lg${
                    form.desiredLeadCount === count && !form.customLeadCount ? ' selected' : ''
                  }`}
                  onClick={() => {
                    updateForm('desiredLeadCount', count);
                    updateForm('customLeadCount', '');
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <label className="mission-field">
            <span className="mission-field-label">Custom count</span>
            <input
              className="mission-input"
              type="number"
              min={1}
              value={form.customLeadCount}
              onChange={(event) => updateForm('customLeadCount', event.target.value)}
              placeholder={`Default: ${form.desiredLeadCount}`}
            />
          </label>

          <div className="mission-chip-group">
            <span className="mission-field-label">Business size</span>
            <div className="mission-chip-row">
              {businessSizeOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`mission-chip${form.targetBusinessSize === value ? ' selected' : ''}`}
                  onClick={() => updateForm('targetBusinessSize', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {step === 'review' ? (
        <section className="wizard-panel">
          <h2 className="wizard-panel-title">Review your mission</h2>
          <p className="wizard-panel-subtitle">
            Confirm the generated strategy before launching prospecting.
          </p>

          {preview ? (
            <div className="mission-review-card">
              <div className="mission-review-summary">
                <CheckCircle2 size={18} />
                <p>{preview.summary}</p>
              </div>

              <div className="mission-review-meta">
                <div>
                  <span className="profile-field-label">Estimated yield</span>
                  <span className="profile-field-value">
                    {preview.estimatedYieldLow}–{preview.estimatedYieldHigh} good leads
                  </span>
                </div>
                <div>
                  <span className="profile-field-label">Difficulty</span>
                  <span className="profile-field-value">
                    {DIFFICULTY_LABELS[preview.difficulty]}
                  </span>
                </div>
              </div>

              {preview.coverageWarning ? (
                <p className="mission-coverage-warning">
                  <AlertTriangle size={14} /> {preview.coverageWarning}
                </p>
              ) : null}

              <p className="mission-review-description">{preview.suggestedDescription}</p>
            </div>
          ) : null}

          <label className="mission-field mission-field-full">
            <span className="mission-field-label">Mission name</span>
            <input
              className="mission-input"
              value={form.name}
              onChange={(event) => {
                updateForm('name', event.target.value);
                updateForm('nameManuallyEdited', true);
              }}
              placeholder="Auto-generated from your selections"
              maxLength={160}
            />
          </label>
        </section>
      ) : null}

      <div className="create-note">
        <Info /> Your saved profile is reused — define targeting once, launch missions in under a
        minute.
      </div>

      {(validationError || createMission.isError) && (
        <p className="mission-form-error" role="alert">
          {validationError ?? mutationErrorMessage(createMission.error)}
        </p>
      )}

      <div className="create-actions">
        <button type="button" className="btn btn-outline" onClick={() => navigate('/missions')}>
          Cancel
        </button>

        {stepIndex > 0 ? (
          <button type="button" className="btn btn-outline" onClick={goBack}>
            <ArrowLeft size={16} /> Back
          </button>
        ) : null}

        {step !== 'review' ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!businessProfile}
            onClick={goNext}
          >
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            disabled={createMission.isPending || !businessProfile}
            onClick={handleSubmit}
          >
            <Rocket size={16} /> {createMission.isPending ? 'Launching…' : 'Launch mission'}
          </button>
        )}
      </div>
    </div>
  );
}
