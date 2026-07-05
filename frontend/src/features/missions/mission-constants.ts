export const missionPriorities = ['fast_wins', 'high_value', 'broad_coverage'] as const;
export type MissionPriority = (typeof missionPriorities)[number];

export const outreachChannels = ['email', 'phone', 'linkedin', 'mixed'] as const;
export type OutreachChannel = (typeof outreachChannels)[number];

export const businessSizeOptions = [
  { value: 'solo', label: 'Solo / 1–5' },
  { value: 'small', label: 'Small / 6–20' },
  { value: 'medium', label: 'Medium / 21–50' },
  { value: 'large', label: 'Large / 50+' },
] as const;

export const leadCountPresets = [10, 25, 50] as const;

export const negativeFilterOptions = [
  'Franchises',
  'Too-large firms',
  'No public contact info',
  'Non-French websites',
  'Low-fit sectors',
] as const;

export const languageOptions = [
  { value: 'fr', label: 'French' },
  { value: 'en', label: 'English' },
] as const;

export const MISSION_PRIORITY_META: Record<
  MissionPriority,
  { label: string; description: string; urgencyEffect: string; searchMode: string }
> = {
  fast_wins: {
    label: 'Fast wins',
    description: 'Prioritize leads you can contact quickly with visible phone numbers.',
    urgencyEffect: 'Runs a fast search — 3 direct queries, no LLM planning, quickest verdict.',
    searchMode: 'Fast search',
  },
  high_value: {
    label: 'High value',
    description: 'Prioritize best-fit accounts even if the list is smaller.',
    urgencyEffect: 'Runs a balanced search — LLM-planned queries with stricter fit scoring.',
    searchMode: 'Balanced search',
  },
  broad_coverage: {
    label: 'Broad coverage',
    description: 'Maximize market reach across your target segment.',
    urgencyEffect:
      'Evolutive deep search — 3 rounds of search, LLM evaluates each batch and evolves queries, then Groq scores every lead.',
    searchMode: 'Deep search',
  },
};

export const OUTREACH_CHANNEL_LABELS: Record<OutreachChannel, string> = {
  email: 'Email',
  phone: 'Phone',
  linkedin: 'LinkedIn',
  mixed: 'Mixed',
};

export const DIFFICULTY_LABELS = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
} as const;

export const WIZARD_STEPS = [
  { id: 'what', label: 'What' },
  { id: 'priority', label: 'Mode' },
  { id: 'goal', label: 'Filters' },
  { id: 'review', label: 'Review' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

export type MissionFormState = {
  selectedSegmentId: string;
  segmentLabel: string;
  target: string;
  location: string;
  language: string;
  triggerSignals: string[];
  buyerRoles: string[];
  missionPriority: MissionPriority | '';
  negativeFilters: string[];
  outreachChannel: OutreachChannel | '';
  targetBusinessSizes: string[];
  desiredLeadCount: number;
  customLeadCount: string;
  name: string;
  nameManuallyEdited: boolean;
  prospectBrief: string;
  assistReasoning: string;
};

export const INITIAL_MISSION_FORM: MissionFormState = {
  selectedSegmentId: '',
  segmentLabel: '',
  target: '',
  location: '',
  language: 'fr',
  triggerSignals: [],
  buyerRoles: [],
  missionPriority: 'fast_wins',
  negativeFilters: [],
  outreachChannel: 'mixed',
  targetBusinessSizes: ['small'],
  desiredLeadCount: 25,
  customLeadCount: '',
  name: '',
  nameManuallyEdited: false,
  prospectBrief: '',
  assistReasoning: '',
};
