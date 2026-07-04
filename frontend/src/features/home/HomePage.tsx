import { Link } from 'react-router-dom';
import {
  Plus,
  Play,
  Users,
  Send,
  Bell,
  ChevronRight,
  ArrowRight,
  UsersRound,
  PenSquare,
  MessageSquare,
  Clock,
  RefreshCw,
  ClipboardList,
  Search,
  User,
  Smile,
  Calendar,
  Activity,
  Building2,
  Reply,
  AlertTriangle,
  Globe,
  Star,
  Target,
  MessageCircle,
} from 'lucide-react';
import { type Priority } from '../../data/mock';
import { useDashboard } from './use-home-api-queries';
import './home.css';

const NBA_ICONS = {
  leads: { Icon: UsersRound, tone: 'blue' },
  draft: { Icon: PenSquare, tone: 'blue' },
  reply: { Icon: MessageSquare, tone: 'green' },
  clock: { Icon: Clock, tone: 'orange' },
  refresh: { Icon: RefreshCw, tone: 'blue' },
} as const;

const STAT_ICONS = {
  missions: ClipboardList,
  search: Search,
  user: User,
  send: Send,
  smile: Smile,
  calendar: Calendar,
} as const;

const FEED_ICONS = {
  building: Building2,
  reply: Reply,
  warning: AlertTriangle,
  globe: Globe,
  star: Star,
} as const;

const priorityClass: Record<Priority, string> = {
  High: 'pill-high',
  Medium: 'pill-medium',
  Low: 'pill-low',
};

function nbaIcon(icon: string) {
  return NBA_ICONS[icon as keyof typeof NBA_ICONS] ?? NBA_ICONS.leads;
}

function statIcon(icon: string) {
  return STAT_ICONS[icon as keyof typeof STAT_ICONS] ?? STAT_ICONS.missions;
}

function feedIcon(icon: string) {
  return FEED_ICONS[icon as keyof typeof FEED_ICONS] ?? FEED_ICONS.building;
}

export function HomePage() {
  const { data, isPending, isError } = useDashboard();

  if (isPending) {
    return <p className="page-subtitle">Loading…</p>;
  }

  if (isError || !data) {
    return <p className="page-subtitle">Unable to load dashboard.</p>;
  }

  const {
    greeting,
    subtitle,
    nextBestActions,
    stats,
    opportunityFeed,
    recentMissions,
    recentProspects,
  } = data;

  return (
    <div>
      <div className="home-header">
        <div>
          <h1 className="page-title">{greeting}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <button className="icon-btn notif-btn" aria-label="Notifications">
          <Bell size={19} />
        </button>
      </div>

      <div className="home-actions">
        <Link to="/missions" className="btn btn-primary">
          <Plus /> Start new mission
        </Link>
        <Link to="/discover" className="btn btn-outline">
          <Play /> Continue current mission
        </Link>
        <Link to="/discover" className="btn btn-outline">
          <Users /> Review leads
        </Link>
        <button className="btn btn-outline">
          <Send /> Send follow-ups
        </button>
      </div>

      <div className="home-section-head">
        <h2 className="section-title">Next Best Actions</h2>
        <a className="link" href="#actions">
          View all actions <ArrowRight />
        </a>
      </div>

      <div className="nba-grid">
        {nextBestActions.map((action) => {
          const { Icon, tone } = nbaIcon(action.icon);
          return (
            <div key={action.title} className="card nba-card">
              <div className="nba-card-top">
                <span className={`icon-tile ${tone}`}>
                  <Icon />
                </span>
                <span className={`pill ${priorityClass[action.priority]}`}>{action.priority}</span>
              </div>
              <div>
                <div className="nba-title">{action.title}</div>
                {action.subtitle && <div className="nba-subtitle">{action.subtitle}</div>}
              </div>
              <ChevronRight size={17} className="nba-chevron" />
            </div>
          );
        })}
      </div>

      <div className="card home-stats">
        {stats.map((stat) => {
          const Icon = statIcon(stat.icon);
          return (
            <div key={stat.label} className="home-stat">
              <span className="icon-tile blue">
                <Icon />
              </span>
              <div>
                <div className="home-stat-label">{stat.label}</div>
                <div className="home-stat-value">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="home-columns">
        <section className="card panel">
          <div className="panel-head">
            <span className="panel-head-title">
              <Activity /> Opportunity Feed
            </span>
            <a className="link" href="#feed">
              View all
            </a>
          </div>
          {opportunityFeed.map((item) => {
            const Icon = feedIcon(item.icon);
            return (
              <div key={item.text} className="feed-item">
                <span className="feed-dot" style={{ background: item.dot }} />
                <span className="feed-icon">
                  <Icon />
                </span>
                <span className="feed-text">{item.text}</span>
                <span className="feed-time">{item.time}</span>
              </div>
            );
          })}
        </section>

        <section className="card panel">
          <div className="panel-head">
            <span className="panel-head-title">
              <Target /> Recent Missions
            </span>
            <Link className="link" to="/missions">
              View all missions <ArrowRight />
            </Link>
          </div>
          {recentMissions.map((mission) => (
              <div key={mission.id} className="rm-item">
                <span className="icon-tile blue">
                  <Building2 />
                </span>
                <div className="rm-body">
                  <div className="rm-top">
                    <span className="rm-name">{mission.name}</span>
                    <span className="rm-pct">{mission.progress}%</span>
                  </div>
                  <div className="rm-meta">
                    <span>{mission.updated}</span>
                  </div>
                  <div className="rm-bar">
                    <div className="rm-bar-fill" style={{ width: `${mission.progress}%`, background: '#2563eb' }} />
                  </div>
                </div>
              </div>
          ))}
        </section>

        <section className="card panel">
          <div className="panel-head">
            <span className="panel-head-title">
              <MessageCircle /> Recent Prospects
            </span>
            <Link className="link" to="/discover">
              View all prospects <ArrowRight />
            </Link>
          </div>
          {recentProspects.map((prospect) => (
            <Link key={prospect.id} to={`/leads/${prospect.id}`} className="rp-item">
              <span className="avatar-initials" style={{ background: `${prospect.color}1a`, color: prospect.color }}>
                {prospect.initials}
              </span>
              <div>
                <div className="rp-name">{prospect.name}</div>
                <div className="rp-meta">{prospect.meta}</div>
              </div>
              <div className="rp-right">
                <span className={`pill pill-${prospect.fitTone}`}>{prospect.fit}</span>
                <span className="rp-time">{prospect.time}</span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
