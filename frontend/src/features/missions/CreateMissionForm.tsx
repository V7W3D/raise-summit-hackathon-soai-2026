import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { BusinessProfileCard } from './BusinessProfileCard';
import { ChipSelector, OptionCard } from './MissionChipSelector';
import { ProspectSegmentPicker } from './ProspectSegmentPicker';
import {
  businessSizeOptions,
  DIFFICULTY_LABELS,
  INITIAL_MISSION_FORM,
  languageOptions,
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
  buildCreatePayload,
  canAdvanceFromStep,
  defaultLocationFromProfile,
  formToPreviewPayload,
  inferLanguageFromLocation,
  toggleChipSelection,
} from './mission-form-utils';
import {
  useCreateMission,
  useMissionAssist,
  useMissionPreview,
  useProspectSegments,
  type MissionPreviewVM,
  type ProspectSegmentVM,
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
  const [segmentsLoaded, setSegmentsLoaded] = useState(false);

  const createMission = useCreateMission();
  const previewMission = useMissionPreview();
  const missionAssist = useMissionAssist();
  const { data: businessProfile, isPending: isProfilePending, isError: isProfileError } =
    useBusinessProfile();
  const {
    data: prospectSegments,
    isPending: isSegmentsPending,
    isError: isSegmentsError,
  } = useProspectSegments(businessProfile?.updatedAt, Boolean(businessProfile));

  const profileRevision = businessProfile?.updatedAt ?? '';

  useEffect(() => {
    if (!profileRevision) return;
    setSegmentsLoaded(false);
    setForm((current) => ({
      ...current,
      selectedSegmentId: '',
      segmentLabel: '',
      target: '',
      triggerSignals: [],
      buyerRoles: [],
      prospectBrief: '',
      assistReasoning: '',
      nameManuallyEdited: false,
    }));
  }, [profileRevision]);

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
    if (!prospectSegments?.segments.length || segmentsLoaded) return;
    const first = prospectSegments.segments[0];
    setForm((current) => ({
      ...current,
      selectedSegmentId: first.id,
      segmentLabel: first.label,
      target: first.target,
      triggerSignals: first.triggerSignals,
      buyerRoles: first.buyerRoles,
    }));
    setSegmentsLoaded(true);
  }, [prospectSegments, segmentsLoaded]);

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
    form.targetBusinessSizes,
    form.missionPriority,
    form.negativeFilters,
    form.triggerSignals,
    form.buyerRoles,
    form.outreachChannel,
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

  const handleSelectSegment = (segment: ProspectSegmentVM) => {
    setForm((current) => ({
      ...current,
      selectedSegmentId: segment.id,
      segmentLabel: segment.label,
      target: segment.target,
      triggerSignals: segment.triggerSignals,
      buyerRoles: segment.buyerRoles,
      prospectBrief: '',
      assistReasoning: '',
      nameManuallyEdited: false,
    }));
    setValidationError(null);
  };

  const handleApplyProspectBrief = () => {
    const query = form.prospectBrief.trim();
    if (query.length < 8) {
      setValidationError('Write at least a short sentence about who you want to prospect.');
      return;
    }

    missionAssist.mutate(
      { query, current_location: form.location.trim() },
      {
        onSuccess: (assist) => {
          setForm((current) => ({
            ...current,
            selectedSegmentId: 'custom',
            segmentLabel: assist.targetLabel,
            target: assist.target,
            triggerSignals: assist.triggerSignals,
            buyerRoles: assist.buyerRoles,
            negativeFilters: assist.negativeFilters.length
              ? assist.negativeFilters
              : current.negativeFilters,
            missionPriority: assist.missionPriority ?? current.missionPriority,
            outreachChannel: assist.outreachChannel ?? current.outreachChannel,
            location: assist.location.trim() || current.location,
            language: assist.location.trim()
              ? inferLanguageFromLocation(assist.location, businessProfile?.languages)
              : current.language,
            assistReasoning: assist.reasoning,
            nameManuallyEdited: false,
          }));
          setValidationError(null);
        },
        onError: () => {
          setValidationError('Could not interpret your description. Try rephrasing it.');
        },
      },
    );
  };

  const stepIndex = WIZARD_STEPS.findIndex((item) => item.id === step);

  const goNext = () => {
    if (!canAdvanceFromStep(step, form)) {
      setValidationError('Describe who you want to prospect and set a location before continuing.');
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
          <h2 className="wizard-panel-title">Who should you prospect?</h2>
          <p className="wizard-panel-subtitle">
            Segments are based on what you sell and who your ideal customers are.
          </p>

          {businessProfile ? (
            <div className="mission-profile-context card">
              <p>
                <strong>You sell:</strong> {businessProfile.whatWeSell}
              </p>
              {businessProfile.idealCustomers.length > 0 ? (
                <p>
                  <strong>Ideal customers:</strong>{' '}
                  {businessProfile.idealCustomers.join(' · ')}
                </p>
              ) : null}
            </div>
          ) : null}

          <ProspectSegmentPicker
            segments={prospectSegments?.segments ?? []}
            selectedId={form.selectedSegmentId}
            onSelect={handleSelectSegment}
            isLoading={isSegmentsPending && !segmentsLoaded}
          />

          {isSegmentsError ? (
            <p className="mission-form-error" role="alert">
              Could not load prospect segments. Check your profile and try again.
            </p>
          ) : null}

          <div className="mission-custom-prospect">
            <label className="mission-field mission-field-full">
              <span className="mission-field-label">Or describe in your own words</span>
              <textarea
                className="mission-input mission-textarea"
                value={form.prospectBrief}
                onChange={(event) => updateForm('prospectBrief', event.target.value)}
                placeholder="e.g. Small garages in Lyon that miss calls when mechanics are under cars"
                rows={3}
              />
            </label>
            <button
              type="button"
              className="btn btn-outline mission-custom-prospect-btn"
              onClick={handleApplyProspectBrief}
              disabled={missionAssist.isPending || form.prospectBrief.trim().length < 8}
            >
              {missionAssist.isPending ? 'Interpreting…' : 'Use this description'}
            </button>
            {form.assistReasoning ? (
              <p className="mission-custom-prospect-reason">
                <Sparkles size={14} /> {form.assistReasoning}
              </p>
            ) : null}
            {form.selectedSegmentId === 'custom' && form.segmentLabel ? (
              <p className="mission-custom-prospect-active">
                Active target: <strong>{form.segmentLabel}</strong>
              </p>
            ) : null}
          </div>

          <label className="mission-field mission-field-full mission-field-spaced">
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

          <div className="mission-chip-group mission-chip-group-spaced">
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

          <div className="mission-option-grid">
            {missionPriorities.map((priority) => {
              const meta = MISSION_PRIORITY_META[priority];
              return (
                <OptionCard
                  key={priority}
                  label={meta.label}
                  description={`${meta.description} ${meta.urgencyEffect}`}
                  selected={form.missionPriority === priority}
                  onSelect={() => updateForm('missionPriority', priority)}
                />
              );
            })}
          </div>

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
          <h2 className="wizard-panel-title">Refine who you hunt</h2>
          <p className="wizard-panel-subtitle">
            The agent runs freely — no fixed lead count. Broad mode uses evolutive deep search
            until coverage is exhausted.
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
                    updateForm(
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
        </section>
      ) : null}

      {step === 'review' ? (
        <section className="wizard-panel">
          <h2 className="wizard-panel-title">Review your mission</h2>

          {preview ? (
            <div className="mission-review-card">
              <div className="mission-review-summary">
                <CheckCircle2 size={18} />
                <p>{preview.summary}</p>
              </div>

              <div className="mission-review-meta mission-review-meta-spaced">
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
