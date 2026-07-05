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
  { label: string; description: string; urgencyEffect: string }
> = {
  fast_wins: {
    label: 'Fast wins',
    description: 'Prioritize leads you can contact quickly with visible phone numbers.',
    urgencyEffect: 'Search favors contactable businesses and recent activity.',
  },
  high_value: {
    label: 'High value',
    description: 'Prioritize best-fit accounts even if the list is smaller.',
    urgencyEffect: 'Search favors ICP fit and buying signals over volume.',
  },
  broad_coverage: {
    label: 'Broad coverage',
    description: 'Maximize market reach across your target segment.',
    urgencyEffect: 'Search explores wider sources to fill the lead count.',
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
  { id: 'goal', label: 'Goal' },
  { id: 'review', label: 'Review' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

export type MissionFormState = {
  targetKeywords: string[];
  target: string;
  location: string;
  language: string;
  missionPriority: MissionPriority | '';
  negativeFilters: string[];
  outreachChannel: OutreachChannel | '';
  targetBusinessSize: string;
  desiredLeadCount: number;
  customLeadCount: string;
  name: string;
  nameManuallyEdited: boolean;
};

export const INITIAL_MISSION_FORM: MissionFormState = {
  targetKeywords: [],
  target: '',
  location: '',
  language: 'fr',
  missionPriority: 'fast_wins',
  negativeFilters: [],
  outreachChannel: 'mixed',
  targetBusinessSize: 'small',
  desiredLeadCount: 25,
  customLeadCount: '',
  name: '',
  nameManuallyEdited: false,
};
