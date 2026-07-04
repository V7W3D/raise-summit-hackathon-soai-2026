import { useState } from 'react';
import {
  Plus,
  Filter,
  ArrowUpDown,
  ChevronDown,
  MoreVertical,
  Users,
  MapPin,
  Archive,
  Building2,
  Fish,
  Calculator,
  Handshake,
  Sprout,
  Truck,
  UserCheck,
  Landmark,
  UserPlus,
  CheckCircle2,
  Lock,
  X,
  Sparkles,
  Send,
  Bell,
  Target,
  SearchCheck,
  ThumbsUp,
  ThumbsDown,
  Link2,
  Info,
} from 'lucide-react';
import { ScoreRing } from '@components/ScoreRing';
import { useCreateMission, useMissions } from './use-missions-api-queries';
import './missions.css';

const MISSION_ICONS = {
  building: Building2,
  fish: Fish,
  calculator: Calculator,
  handshake: Handshake,
  sprout: Sprout,
} as const;

function missionIcon(icon: string) {
  return MISSION_ICONS[icon as keyof typeof MISSION_ICONS] ?? Building2;
}

// Maps a "What do you need?" choice to mission metadata for creation.
const NEED_TO_MISSION: Record<string, { type: string; icon: string; color: string }> = {
  'Find clients': { type: 'Clients', icon: 'building', color: 'blue' },
  'Find suppliers': { type: 'Suppliers', icon: 'fish', color: 'blue' },
  'Find consultants': { type: 'Consultants', icon: 'calculator', color: 'purple' },
  'Find partners': { type: 'Partners', icon: 'handshake', color: 'green' },
  'Find investors': { type: 'Investors', icon: 'sprout', color: 'orange' },
  'Find hires': { type: 'Hires', icon: 'building', color: 'blue' },
};

const RING_COLORS: Record<string, string> = {
  blue: '#2563eb',
  green: '#16a34a',
  purple: '#7c5cf0',
  orange: '#ea8a1f',
};

const NEED_OPTIONS = [
  { label: 'Find clients', icon: Building2 },
  { label: 'Find suppliers', icon: Truck },
  { label: 'Find consultants', icon: UserCheck },
  { label: 'Find partners', icon: Handshake },
  { label: 'Find investors', icon: Landmark },
  { label: 'Find hires', icon: UserPlus },
];

const CRITERIA = [
  { label: 'Budget size', value: '€50K – €250K' },
  { label: 'Business size', value: '10 – 100 employees' },
  { label: 'Activity sector', value: 'HORECA, Retail' },
  { label: 'Urgency', value: 'Within 3 months' },
  { label: 'Preferred contact', value: 'Email & LinkedIn' },
  { label: 'Language / country', value: 'French, English (FR, BE)' },
];

const SUMMARY_ITEMS = [
  { icon: Building2, title: 'Target profile', text: 'Restaurants & retailers in France looking for premium seafood suppliers.' },
  { icon: Link2, title: 'Suggested sources', text: 'LinkedIn, Kompass, Europages, trade shows.' },
  { icon: SearchCheck, title: 'Search strategy', text: 'Find businesses with consistent seafood demand and quality focus.' },
  { icon: Send, title: 'Recommended outreach style', text: 'Value-first email with quality & reliability focus.' },
  { icon: ThumbsUp, title: 'Good-fit signals', text: 'Online presence, sustainable sourcing, premium.' },
  { icon: ThumbsDown, title: 'Bad-fit signals', text: 'Low order frequency, commodity focus, no cold chain.' },
];

export function MissionsPage() {
  const [selectedNeed, setSelectedNeed] = useState('Find clients');
  const { data, isPending, isError } = useMissions();
  const missions = data ?? [];
  const createMission = useCreateMission();

  if (isPending) {
    return <p className="page-subtitle">Loading…</p>;
  }

  if (isError) {
    return <p className="page-subtitle">Unable to load missions.</p>;
  }

  const handleCreate = () => {
    const meta = NEED_TO_MISSION[selectedNeed] ?? NEED_TO_MISSION['Find clients'];
    createMission.mutate({
      name: `New ${meta.type} Mission`,
      target: `Target: ${meta.type.toLowerCase()}`,
      mission_type: meta.type,
      location: 'France',
      status: 'Draft',
      icon: meta.icon,
      color: meta.color,
    });
  };

  return (
    <div className="missions-layout">
      <div>
        <h1 className="page-title">Prospecting Missions</h1>
        <p className="page-subtitle">Create structured prospecting goals and manage your active missions.</p>

        <div className="missions-toolbar" style={{ justifyContent: 'flex-start' }}>
          <button className="btn btn-primary" onClick={handleCreate} disabled={createMission.isPending}>
            <Plus /> {createMission.isPending ? 'Creating…' : 'New mission'}
          </button>
        </div>

        <div className="missions-toolbar">
          <h2 className="section-title">Mission list</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="select-control">
              <Filter /> All statuses <ChevronDown />
            </button>
            <button className="select-control">
              <ArrowUpDown /> Last activity <ChevronDown />
            </button>
          </div>
        </div>

        {missions.map((mission) => {
          const Icon = missionIcon(mission.icon);
          return (
            <div key={mission.id} className="card mission-card">
              <div className="mission-id">
                <span className={`icon-tile ${mission.color}`}>
                  <Icon />
                </span>
                <div>
                  <div className="mission-name">{mission.name}</div>
                  <div className="mission-target">{mission.target}</div>
                  <div className="mission-tags">
                    <span className="mission-tag">
                      <Users /> {mission.type}
                    </span>
                    <span className="mission-tag">
                      <MapPin /> {mission.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mission-stats">
                <div>
                  <div className="mission-stat-label">Leads found</div>
                  <div className="mission-stat-value">{mission.leadsFound}</div>
                </div>
                <div>
                  <div className="mission-stat-label">Qualified</div>
                  <div className="mission-stat-value">{mission.qualified}</div>
                </div>
                <div>
                  <div className="mission-stat-label">Outreach sent</div>
                  <div className="mission-stat-value">{mission.outreach}</div>
                </div>
              </div>

              <div className="mission-right">
                <ScoreRing
                  value={mission.progress}
                  size={54}
                  stroke={5}
                  color={RING_COLORS[mission.color]}
                  fontSize={13}
                  label={`${mission.progress}%`}
                />
                <div className="mission-status">
                  <span className={`pill pill-${mission.statusTone}`}>{mission.status}</span>
                  <span className="mission-last">
                    {mission.lastActivity}
                    <br />
                    Last activity
                  </span>
                </div>
                <button className="icon-btn" aria-label="Mission options">
                  <MoreVertical size={17} />
                </button>
              </div>
            </div>
          );
        })}

        <button className="missions-archived">
          <Archive size={16} /> View archived missions (4)
        </button>
      </div>

      <aside className="card create-panel">
        <div className="create-panel-head">
          <span className="create-panel-title">Create New Mission</span>
          <button className="icon-btn notif-btn" aria-label="Notifications">
            <Bell size={18} />
          </button>
        </div>

        <div className="create-step">
          <div className="create-step-head">
            <span className="step-num">1</span> What do you need?
          </div>
          <div className="need-grid">
            {NEED_OPTIONS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={`need-option${selectedNeed === label ? ' selected' : ''}`}
                onClick={() => setSelectedNeed(label)}
              >
                <Icon /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="create-step">
          <div className="create-step-head">
            <span className="step-num">2</span> Use saved business profile
          </div>
          <div className="profile-card">
            <div className="profile-card-head">
              <CheckCircle2 size={16} /> Using your saved business profile
            </div>
            <div className="profile-grid">
              <div>
                <div className="profile-field-label">Business type</div>
                <div className="profile-field-value">Seafood Import & Distribution</div>
              </div>
              <div>
                <div className="profile-field-label">Target market</div>
                <div className="profile-field-value">Restaurants & retailers</div>
              </div>
              <div>
                <div className="profile-field-label">What you sell</div>
                <div className="profile-field-value">Premium seafood products</div>
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
            <span className="step-num">3</span> What are you looking for exactly?
          </div>
          <div className="criteria-grid">
            {CRITERIA.map((criterion) => (
              <div key={criterion.label} className="criteria-chip">
                <div className="criteria-chip-label">{criterion.label}</div>
                <div className="criteria-chip-value">
                  {criterion.value} <X />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="create-step">
          <div className="create-step-head">
            <span className="step-num">4</span> Success definition
          </div>
          <div className="success-row">
            <div className="criteria-chip">
              <div className="criteria-chip-label">Qualified leads</div>
              <div className="criteria-chip-value">
                10 <X />
              </div>
            </div>
            <div className="criteria-chip">
              <div className="criteria-chip-label">Meetings booked</div>
              <div className="criteria-chip-value">
                3 <X />
              </div>
            </div>
            <span className="success-or">Or</span>
            <div className="criteria-chip">
              <div className="criteria-chip-label">Suppliers found</div>
              <div className="criteria-chip-value">
                1 <X />
              </div>
            </div>
          </div>
        </div>

        <div className="create-step" style={{ marginBottom: 0 }}>
          <div className="create-step-head">
            <span className="step-num">5</span> AI mission summary
            <Sparkles size={15} style={{ color: 'var(--purple)' }} />
          </div>
          <div className="summary-card">
            {SUMMARY_ITEMS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="summary-item">
                <Icon />
                <span>
                  <span className="summary-item-title">{title}</span>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="create-note">
          <Info /> This profile is saved from onboarding and applied to every mission you create.
        </div>

        <div className="create-actions">
          <button className="btn btn-outline">Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={createMission.isPending}>
            <Target size={16} /> {createMission.isPending ? 'Creating…' : 'Create mission'}
          </button>
        </div>
      </aside>
    </div>
  );
}
