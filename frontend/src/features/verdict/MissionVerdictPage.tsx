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
  BadgeCheck,
} from 'lucide-react';
import { useLeads } from '../discover/use-discover-api-queries';
import { NetworkMemberBadge, sortLeadsWithNetworkPriority } from '../leads/NetworkMemberBadge';
import { useUpdateLeadStatus, type LeadVM } from '../leads/use-leads-api-queries';
import '../leads/network-member-badge.css';
import { useMission, useMissionSearchProgress } from '../missions/use-missions-api-queries';
import './verdict.css';

const SHORTLIST_MAX = 8;
const SHORTLIST_MIN_SCORE = 75;
const REVIEW_MIN_SCORE = 60;
const VERDICT_TEXT_MAX = 200;

function truncateVerdictText(text: string, max = VERDICT_TEXT_MAX): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function skipReason(lead: LeadVM): string {
  if (lead.missing.length > 0) {
    return truncateVerdictText(lead.missing.slice(0, 2).join(' · '));
  }
  if (lead.why.length > 0) {
    return truncateVerdictText(lead.why[0]);
  }
  return 'Low overall fit for this mission';
}

function evidenceHref(source: string, website: string): string | null {
  if (/^https?:\/\//i.test(source)) return source;
  if (website) return `https://${website}`;
  return null;
}

function uniqueVerdictEvidence(
  evidence: LeadVM['evidence'],
  max = 2,
): LeadVM['evidence'] {
  const seen = new Set<string>();
  const unique: LeadVM['evidence'] = [];
  for (const item of evidence) {
    const key = item.quote.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= max) break;
  }
  return unique;
}

function VerdictLeadCard({ lead }: { lead: LeadVM }) {
  const navigate = useNavigate();
  const updateStatus = useUpdateLeadStatus();
  const evidence = uniqueVerdictEvidence(lead.evidence);

  return (
    <article
      className={`verdict-lead card${lead.status === 'approved' ? ' approved' : ''}${
        lead.isNetworkMember
          ? ` network-member${lead.networkBadge === 'sponsored' ? ' sponsored' : ''}`
          : ''
      }`}
    >
      <header className="verdict-lead-head">
        <span className="verdict-lead-logo" style={{ background: lead.logoColor }}>
          {lead.initials}
        </span>
        <div className="verdict-lead-title">
          <div className="verdict-lead-name-row">
            <Link to={`/leads/${lead.id}`} className="verdict-lead-name">
              {lead.name}
            </Link>
            <NetworkMemberBadge lead={lead} />
          </div>
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
                <span className="verdict-evidence-quote">
                  “{truncateVerdictText(item.quote)}”
                </span>
                {href ? (
                  <a
                    className="verdict-evidence-src"
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {truncateVerdictText(item.source, 80)} <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="verdict-evidence-src">
                    {truncateVerdictText(item.source, 80)}
                  </span>
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
    const sorted = sortLeadsWithNetworkPriority(active);
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

  const networkCount = leads.filter((lead) => lead.isNetworkMember).length;

  return (
    <div className="verdict">
      <header className="verdict-header">
        <div>
          <h1 className="page-title">
            <Sparkles size={22} className="verdict-title-icon" /> Agent verdict
          </h1>
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

      {networkCount > 0 ? (
        <div className="network-value-banner card">
          <BadgeCheck size={20} color="#1d4ed8" />
          <div>
            <strong>
              {networkCount} Scouter network member{networkCount === 1 ? '' : 's'} in your results
            </strong>
            <p>
              These companies subscribe to Scouter and get priority visibility when other
              businesses prospect in their space — join the network to be featured in future
              verdicts.
            </p>
          </div>
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
          Low value ({skipped.length})
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
