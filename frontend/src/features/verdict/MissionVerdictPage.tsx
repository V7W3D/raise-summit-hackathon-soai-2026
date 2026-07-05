import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useLeads } from '../discover/use-discover-api-queries';
import { useUpdateLeadStatus, type LeadVM } from '../leads/use-leads-api-queries';
import { useMission, useMissionSearchProgress } from '../missions/use-missions-api-queries';
import './verdict.css';

const SHORTLIST_MAX = 8;
const SHORTLIST_MIN_SCORE = 75;
const REVIEW_MIN_SCORE = 60;

function skipReason(lead: LeadVM): string {
  if (lead.missing.length > 0) {
    return lead.missing.slice(0, 2).join(' · ');
  }
  if (lead.why.length > 0) {
    return lead.why[0];
  }
  return 'Low overall fit for this mission';
}

function evidenceHref(source: string, website: string): string | null {
  if (/^https?:\/\//i.test(source)) return source;
  if (website) return `https://${website}`;
  return null;
}

function VerdictLeadCard({ lead }: { lead: LeadVM }) {
  const navigate = useNavigate();
  const updateStatus = useUpdateLeadStatus();
  const evidence = lead.evidence.slice(0, 3);

  return (
    <article className={`verdict-lead card${lead.status === 'approved' ? ' approved' : ''}`}>
      <header className="verdict-lead-head">
        <span className="verdict-lead-logo" style={{ background: lead.logoColor }}>
          {lead.initials}
        </span>
        <div className="verdict-lead-title">
          <Link to={`/leads/${lead.id}`} className="verdict-lead-name">
            {lead.name}
          </Link>
          <span className="verdict-lead-meta">
            {lead.location ? (
              <>
                <MapPin size={12} /> {lead.location}
              </>
            ) : null}
            {lead.email ? (
              <>
                <Mail size={12} /> {lead.email}
              </>
            ) : lead.phone ? (
              <>
                <Phone size={12} /> {lead.phone}
              </>
            ) : null}
          </span>
        </div>
        <div className="verdict-lead-score">
          <span className="verdict-lead-score-value">{lead.score}</span>
          <span className={`pill pill-${lead.scoreTone}`}>{lead.scoreLabel}</span>
        </div>
      </header>

      {evidence.length > 0 ? (
        <ul className="verdict-evidence">
          {evidence.map((item) => {
            const href = evidenceHref(item.source, lead.website);
            return (
              <li key={item.quote + item.source}>
                <span className="verdict-evidence-quote">“{item.quote}”</span>
                {href ? (
                  <a
                    className="verdict-evidence-src"
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.source} <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="verdict-evidence-src">{item.source}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      <footer className="verdict-lead-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/leads/${lead.id}`)}
        >
          <Mail size={15} /> Draft outreach
        </button>
        <button
          type="button"
          className="btn btn-outline"
          disabled={updateStatus.isPending}
          onClick={() =>
            updateStatus.mutate({
              id: lead.id,
              status: lead.status === 'approved' ? 'new' : 'approved',
            })
          }
        >
          <Check size={15} /> {lead.status === 'approved' ? 'Approved' : 'Approve'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={updateStatus.isPending}
          onClick={() => updateStatus.mutate({ id: lead.id, status: 'rejected' })}
        >
          <X size={15} /> Skip
        </button>
      </footer>
    </article>
  );
}

export function MissionVerdictPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const id = Number(missionId);
  const { data: mission } = useMission(id);
  const { data: leads = [], isPending } = useLeads({ missionId: id });
  const { data: progress } = useMissionSearchProgress(id, { enabled: !Number.isNaN(id) });
  const [showSkipped, setShowSkipped] = useState(false);

  const { shortlist, review, skipped } = useMemo(() => {
    const active = leads.filter((lead) => lead.status !== 'rejected');
    const rejectedByUser = leads.filter((lead) => lead.status === 'rejected');
    const sorted = [...active].sort((a, b) => b.score - a.score);
    const shortlist = sorted
      .filter((lead) => lead.score >= SHORTLIST_MIN_SCORE)
      .slice(0, SHORTLIST_MAX);
    const shortlistIds = new Set(shortlist.map((lead) => lead.id));
    const review = sorted.filter(
      (lead) => !shortlistIds.has(lead.id) && lead.score >= REVIEW_MIN_SCORE,
    );
    const skipped = [
      ...sorted.filter((lead) => !shortlistIds.has(lead.id) && lead.score < REVIEW_MIN_SCORE),
      ...rejectedByUser,
    ];
    return { shortlist, review, skipped };
  }, [leads]);

  if (isPending) {
    return <p className="page-subtitle">Loading verdict…</p>;
  }

  const showAgentStats = progress !== undefined && progress.phase === 'done';

  return (
    <div className="verdict">
      <header className="verdict-header">
        <div>
          <h1 className="page-title">
            <Sparkles size={22} className="verdict-title-icon" /> Agent verdict
          </h1>
          <p className="page-subtitle">
            {mission
              ? `${mission.target || mission.name}${mission.location ? ` in ${mission.location}` : ''}`
              : 'Mission results'}{' '}
            — contact {shortlist.length}, skip {skipped.length}.
          </p>
        </div>
        <Link to={`/discover?mission=${id}`} className="btn btn-outline">
          <Search size={15} /> Open in Discover
        </Link>
      </header>

      {showAgentStats ? (
        <div className="verdict-stats card">
          {[
            { label: 'Queries run', value: progress.queriesRun },
            { label: 'Results found', value: progress.resultsFound },
            { label: 'Pages scanned', value: progress.pagesFetched },
            { label: 'Emails extracted', value: progress.emailsFound },
            {
              label: 'Time to verdict',
              value: `${Math.max(Math.round(progress.elapsedMs / 1000), 1)}s`,
            },
          ].map((stat) => (
            <div key={stat.label} className="verdict-stat">
              <span className="verdict-stat-value">{stat.value}</span>
              <span className="verdict-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      <section className="verdict-section">
        <h2 className="verdict-section-title">
          Contact these {shortlist.length} now
          <span className="verdict-section-hint">
            High fit, verified evidence, contact channel found.
          </span>
        </h2>
        {shortlist.length > 0 ? (
          <div className="verdict-grid">
            {shortlist.map((lead) => (
              <VerdictLeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        ) : (
          <p className="verdict-empty">
            No leads cleared the high-fit bar on this run. Check the “worth a second look”
            list below, or re-run the search with broader targeting.
          </p>
        )}
      </section>

      {review.length > 0 ? (
        <section className="verdict-section">
          <h2 className="verdict-section-title">
            Worth a second look ({review.length})
            <span className="verdict-section-hint">
              Promising fit, but missing contact info or confirmation.
            </span>
          </h2>
          <div className="verdict-grid">
            {review.map((lead) => (
              <VerdictLeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="verdict-section">
        <button
          type="button"
          className="verdict-skipped-toggle"
          onClick={() => setShowSkipped((current) => !current)}
          aria-expanded={showSkipped}
        >
          {showSkipped ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Skipped {skipped.length} lead{skipped.length === 1 ? '' : 's'} — don’t waste time here
        </button>
        {showSkipped ? (
          skipped.length > 0 ? (
            <ul className="verdict-skipped-list">
              {skipped.map((lead) => (
                <li key={lead.id} className="verdict-skipped-item">
                  <Link to={`/leads/${lead.id}`} className="verdict-skipped-name">
                    {lead.name}
                  </Link>
                  <span className="verdict-skipped-reason">
                    {lead.status === 'rejected' ? 'Rejected by you' : skipReason(lead)}
                  </span>
                  <span className="verdict-skipped-score">{lead.score}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="verdict-empty">Nothing was skipped on this run.</p>
          )
        ) : null}
      </section>
    </div>
  );
}
