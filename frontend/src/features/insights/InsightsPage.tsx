import {
  Download,
  GitCompareArrows,
  Calendar,
  ChevronDown,
  MoreHorizontal,
  Info,
  Users,
  CheckCircle2,
  Send,
  MessageSquare,
  Star,
  CalendarCheck,
  Target,
  TrendingUp,
  Building2,
  User,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import {
  missionPerformance,
  funnelStages,
  funnelDrops,
  weeklyChanges,
  bestPatterns,
  sourceQuality,
  recommendations,
} from '../../data/mock';
import './insights.css';

const PERF_ICONS = {
  user: { Icon: Users, tone: 'blue' },
  check: { Icon: CheckCircle2, tone: 'green' },
  send: { Icon: Send, tone: 'blue' },
  reply: { Icon: MessageSquare, tone: 'purple' },
  star: { Icon: Star, tone: 'orange' },
  calendar: { Icon: CalendarCheck, tone: 'green' },
  target: { Icon: Target, tone: 'purple' },
} as const;

const CHANGE_ICONS = {
  trend: { Icon: TrendingUp, tone: 'green' },
  building: { Icon: Building2, tone: 'blue' },
  calendar: { Icon: CalendarCheck, tone: 'orange' },
} as const;

const PATTERN_ICONS = {
  user: User,
  pin: MapPin,
  mail: Mail,
  phone: Phone,
} as const;

const SOURCE_ICON_STYLE: Record<string, { bg: string; color: string; letter: string }> = {
  google: { bg: '#fdeaea', color: '#dc2626', letter: 'G' },
  directory: { bg: '#eaf1fe', color: '#2563eb', letter: 'D' },
  referral: { bg: '#e8f7ee', color: '#16a34a', letter: 'R' },
  feed: { bg: '#f3f0fd', color: '#7c5cf0', letter: 'F' },
};

const REC_ICONS = {
  target: Target,
  users: Users,
  phone: Phone,
  mail: Mail,
} as const;

export function InsightsPage() {
  return (
    <div>
      <div className="ins-header">
        <div>
          <h1 className="page-title">Insights &amp; Learning</h1>
          <p className="page-subtitle">
            Understand what works, where prospects drop off, and how to improve your next mission.
          </p>
        </div>
        <div className="ins-header-actions">
          <button className="btn btn-outline">
            <Download /> Export report
          </button>
          <button className="btn btn-outline">
            <GitCompareArrows /> Compare missions
          </button>
          <button className="select-control">
            <Calendar /> May 23 – May 30, 2025 <ChevronDown />
          </button>
          <button className="icon-btn bordered" aria-label="More options">
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      <div className="ins-selectors">
        <div className="card ins-mission-select">
          <span className="avatar">RP</span>
          <div>
            <div className="ins-select-label">Active mission</div>
            <div className="ins-select-value">Construction Clients – Lyon</div>
          </div>
          <ChevronDown size={16} className="chev" />
        </div>
        <div className="card ins-mission-select">
          <div>
            <div className="ins-select-label">Compare to (optional)</div>
            <div className="ins-select-value" style={{ color: 'var(--faint)', fontWeight: 500 }}>
              Select a mission to compare
            </div>
          </div>
          <ChevronDown size={16} className="chev" />
        </div>
      </div>

      <div className="home-section-head" style={{ marginBottom: 12 }}>
        <h2 className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          Mission performance <Info size={14} style={{ color: 'var(--faint)' }} />
        </h2>
      </div>

      <div className="perf-grid">
        {missionPerformance.map((metric) => {
          const { Icon, tone } = PERF_ICONS[metric.icon];
          return (
            <div key={metric.label} className="card perf-card">
              <span className={`icon-tile ${tone}`}>
                <Icon />
              </span>
              <div className="perf-label">{metric.label}</div>
              <div className="perf-value">{metric.value}</div>
              <div className={`perf-delta ${metric.deltaTone}`}>{metric.delta}</div>
            </div>
          );
        })}
      </div>

      <div className="ins-mid">
        <div className="card funnel-card">
          <h3 className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            Drop-off analysis <Info size={14} style={{ color: 'var(--faint)' }} />
          </h3>
          <div className="funnel-sub">Where leads are lost in your process</div>
          <div className="funnel-track">
            {funnelStages.map((stage) => (
              <div key={stage.label} className="funnel-stage">
                <div className="funnel-stage-label">{stage.label}</div>
                <div className="funnel-stage-value">{stage.value}</div>
                <div className="funnel-stage-pct">{stage.pct}</div>
              </div>
            ))}
          </div>
          <div className="funnel-drops">
            {funnelDrops.map((drop) => (
              <div key={drop.note} className="funnel-drop">
                <span className={`funnel-drop-delta ${drop.tone}`}>{drop.delta}</span>
                <br />
                {drop.note}
              </div>
            ))}
          </div>
        </div>

        <div className="card changes-card">
          <div className="changes-head">
            <TrendingUp /> What changed this week
          </div>
          {weeklyChanges.map((change) => {
            const { Icon, tone } = CHANGE_ICONS[change.icon];
            return (
              <div key={change.title} className="change-item">
                <span className={`icon-tile ${tone}`}>
                  <Icon />
                </span>
                <div>
                  <div className="change-title">{change.title}</div>
                  <div className="change-text">{change.text}</div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 14 }}>
            <a className="link" href="#timeline">
              View full timeline <ArrowRight />
            </a>
          </div>
        </div>
      </div>

      <div className="ins-bottom">
        <div className="card patterns-card">
          <h3 className="section-title" style={{ marginBottom: 6 }}>
            Best-performing patterns
          </h3>
          {bestPatterns.map((pattern) => {
            const Icon = PATTERN_ICONS[pattern.icon];
            return (
              <div key={pattern.title} className="pattern-item">
                <span className="pattern-rank">{pattern.rank}</span>
                <span className="pattern-icon">
                  <Icon />
                </span>
                <div>
                  <div className="pattern-title">{pattern.title}</div>
                  <div className="pattern-text">{pattern.text}</div>
                </div>
                <span className={`pill ${pattern.level === 'High' ? 'pill-green' : 'pill-orange'}`}>{pattern.level}</span>
              </div>
            );
          })}
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <a className="link" href="#insights">
              View all insights
            </a>
          </div>
        </div>

        <div className="card sources-card">
          <h3 className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            Source quality <Info size={14} style={{ color: 'var(--faint)' }} />
          </h3>
          <div className="source-table-head">
            <span>Source</span>
            <span>Qualified rate</span>
            <span>Reply rate</span>
          </div>
          {sourceQuality.map((source) => {
            const style = SOURCE_ICON_STYLE[source.icon];
            return (
              <div key={source.name} className="source-row">
                <span className="source-name">
                  <span className="src-icon" style={{ background: style.bg, color: style.color }}>
                    {style.letter}
                  </span>
                  {source.name}
                </span>
                <span className="source-metric">
                  {source.qualified}%
                  <span className="source-bar">
                    <span
                      className="source-bar-fill"
                      style={{ width: `${source.qualified}%`, background: '#16a34a', display: 'block' }}
                    />
                  </span>
                </span>
                <span className="source-metric">
                  {source.reply}%
                  <span className="source-bar">
                    <span
                      className="source-bar-fill"
                      style={{ width: `${source.reply * 3}%`, background: '#2563eb', display: 'block' }}
                    />
                  </span>
                  {source.starred && <Star size={13} style={{ color: '#eab308', fill: '#eab308' }} />}
                </span>
              </div>
            );
          })}
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <a className="link" href="#sources">
              View all sources
            </a>
          </div>
        </div>

        <div className="card recs-card">
          <div className="recs-head">
            <span className="icon-tile purple">
              <Sparkles />
            </span>
            <h3 className="section-title">Recommendations</h3>
          </div>
          <div className="recs-sub">AI-powered suggestions to improve your next mission.</div>
          {recommendations.map((rec) => {
            const Icon = REC_ICONS[rec.icon];
            return (
              <div key={rec.title} className="rec-item">
                <span className="rec-icon">
                  <Icon />
                </span>
                <div>
                  <div className="rec-title">{rec.title}</div>
                  <div className="rec-text">{rec.text}</div>
                </div>
                <button className="btn btn-outline btn-sm">Take action</button>
              </div>
            );
          })}
          <div style={{ marginTop: 12 }}>
            <a className="link" href="#recommendations">
              See all recommendations <ArrowRight />
            </a>
          </div>
        </div>
      </div>

      <div className="improve-banner">
        <span className="icon-tile green">
          <Trophy />
        </span>
        <div>
          <div className="improve-title">You’re improving! 🎉</div>
          <div className="improve-text">Your reply rate is up 3.1pp and meetings are up 2 compared to last week.</div>
        </div>
        <button className="btn btn-outline btn-sm">
          Keep it up <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
