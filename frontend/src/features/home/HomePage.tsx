import { Link } from 'react-router-dom';
import { Plus, Play, ArrowRight } from 'lucide-react';
import { useDashboard } from './use-home-api-queries';
import './home.css';

const KEY_METRIC_LABELS = ['New leads found this week', 'Qualified leads'] as const;

export function HomePage() {
  const { data, isPending, isError } = useDashboard();

  if (isPending) {
    return <p className="home-loading">Loading your workspace…</p>;
  }

  if (isError || !data) {
    return <p className="home-loading">Unable to load dashboard.</p>;
  }

  const { stats, recentMissions, recentProspects } = data;

  const keyMetrics = stats.filter((stat) =>
    KEY_METRIC_LABELS.includes(stat.label as (typeof KEY_METRIC_LABELS)[number]),
  );

  const missions = recentMissions.slice(0, 3);
  const prospects = recentProspects.slice(0, 3);

  return (
    <div className="home">
      <div className="home-top">
        <div className="home-intro">
          <div className="home-kpi-grid">
            {keyMetrics.map((stat) => (
              <div key={stat.label} className="home-kpi-widget">
                <span className="home-kpi-value">{stat.value}</span>
                <span className="home-kpi-label">{stat.label}</span>
              </div>
            ))}
          </div>

          <nav className="home-actions" aria-label="Quick actions">
            <Link to="/missions/new" className="home-btn home-btn-primary">
              <Plus /> Start new mission
            </Link>
            <Link to="/discover" className="home-btn home-btn-outline">
              <Play /> Continue current mission
            </Link>
          </nav>
        </div>
      </div>

      <div className="home-grid">
        <section className="home-panel">
          <div className="home-panel-head">
            <h2 className="home-panel-title">Missions</h2>
            <Link className="home-panel-link" to="/missions">
              View all <ArrowRight />
            </Link>
          </div>
          <ul className="home-missions">
            {missions.map((mission) => (
              <li key={mission.id} className="home-mission">
                <div className="home-mission-row">
                  <span className="home-mission-name">{mission.name}</span>
                  <span className="home-mission-pct">{mission.progress}%</span>
                </div>
                <span className="home-mission-meta">{mission.updated}</span>
                <div className="home-mission-bar">
                  <div className="home-mission-fill" style={{ width: `${mission.progress}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-panel">
          <div className="home-panel-head">
            <h2 className="home-panel-title">Prospects</h2>
            <Link className="home-panel-link" to="/discover">
              View all <ArrowRight />
            </Link>
          </div>
          <ul className="home-prospects">
            {prospects.map((prospect) => (
              <li key={prospect.id}>
                <Link to={`/leads/${prospect.id}`} className="home-prospect">
                  <div className="home-prospect-row">
                    <span className="home-prospect-name">{prospect.name}</span>
                    <span className="home-prospect-time">{prospect.time}</span>
                  </div>
                  <span className="home-prospect-meta">{prospect.meta}</span>
                  <span className="home-prospect-fit">{prospect.fit}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
