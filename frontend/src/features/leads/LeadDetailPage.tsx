import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  MessageSquare,
  MoreHorizontal,
  Users,
  MapPin,
  AlertTriangle,
  Mail,
  Sparkles,
  Search,
  Phone,
  Bookmark,
  XCircle,
  Globe,
  FileSearch,
  ExternalLink,
  CheckCircle2,
  Copy,
  X,
  StickyNote,
  ChevronDown,
  Zap,
  Target,
} from 'lucide-react';
import type { CSSProperties, ElementType } from 'react';
import { useLead, useUpdateLeadStatus } from './use-leads-api-queries';
import { useMission } from '../missions/use-missions-api-queries';
import { bestNextMove, type NextMoveAction } from './best-next-move';
import { OutreachDraftPanel } from '../outreach/OutreachDraftPanel';
import './lead-detail.css';

function Linkedin({ size = 16, style, className }: { size?: number; style?: CSSProperties; className?: string }) {
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        background: style?.color ?? '#4a6278',
        color: '#fff',
        display: 'inline-grid',
        placeItems: 'center',
        fontSize: size * 0.55,
        fontWeight: 700,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      in
    </span>
  );
}

const MATCH_ICONS: { icon: ElementType; tone: string }[] = [
  { icon: Target, tone: 'blue' },
  { icon: Users, tone: 'green' },
  { icon: MapPin, tone: 'purple' },
  { icon: Zap, tone: 'orange' },
];

const NEXT_STEPS: { action: NextMoveAction | null; icon: ElementType; color: string; title: string; text: string }[] = [
  { action: 'email', icon: Mail, color: '#4a6278', title: 'Draft email', text: 'Create a short, value-first outreach email.' },
  { action: 'enrich', icon: Linkedin, color: '#4a6278', title: 'Enrich contact', text: 'Find decision-makers and direct contact points.' },
  { action: 'call', icon: Phone, color: '#4d7c5c', title: 'Call directly', text: 'Call the main number with a short script.' },
  { action: 'deprioritize', icon: Bookmark, color: '#6b5f7a', title: 'Save for later', text: 'Add to a list and follow up later.' },
  { action: null, icon: XCircle, color: '#9b4d4d', title: 'Reject lead', text: 'Not a good fit right now.' },
];

const CONFIDENCE_TONE: Record<string, string> = {
  High: 'green',
  Medium: 'blue',
  Low: 'orange',
};

const STATUS_LABELS = {
  new: 'New',
  approved: 'Approved',
  rejected: 'Rejected',
} as const;

function scorePillClass(tone: string): string {
  return `pill-${tone}`;
}

function websiteHref(website: string): string {
  if (!website) return '#';
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

export function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const { data: lead, isPending, isError } = useLead(leadId);
  const { data: mission } = useMission(lead?.missionId ?? Number.NaN);
  const updateStatus = useUpdateLeadStatus();
  const [showOutreach, setShowOutreach] = useState(false);

  if (isPending) {
    return <p className="page-subtitle">Loading…</p>;
  }

  if (isError || !lead) {
    return <p className="page-subtitle">Lead not found.</p>;
  }

  const timeline = lead.sourcesScanned.map((s) => ({
    label: s.label.replace(/ scanned$/, ''),
    done: true,
  }));

  const warnings = lead.missing.map((m) => ({ icon: AlertTriangle, title: m }));

  const move = bestNextMove(lead);

  const isApproved = lead.status === 'approved';
  const isRejected = lead.status === 'rejected';
  const statusPending = updateStatus.isPending;

  const setStatus = (status: 'new' | 'approved' | 'rejected') =>
    updateStatus.mutate({ id: lead.id, status });

  const facts = [
    { label: 'Industry', value: lead.industry || '—' },
    { label: 'Employees (est.)', value: lead.employees || '—' },
    { label: 'Service area', value: lead.serviceArea || lead.location || '—' },
    { label: 'Business type', value: lead.businessType || '—' },
    { label: 'Status', value: STATUS_LABELS[lead.status] },
  ];

  return (
    <div>
      <div className="ld-header">
        <div>
          <h1 className="page-title">Lead Verification</h1>
          <p className="page-subtitle">Inspect evidence, confirm fit, and decide the next action.</p>
          <nav className="ld-breadcrumb">
            <Link to="/discover">Discover</Link>
            <ChevronRight />
            {mission ? (
              <>
                <Link to={`/discover?mission=${mission.id}`}>{mission.name}</Link>
                <ChevronRight />
              </>
            ) : null}
            <span className="current">{lead.name}</span>
          </nav>
        </div>
        <div className="discover-header-actions" style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="btn btn-primary" onClick={() => setShowOutreach(true)}>
            <Mail /> Draft outreach
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={statusPending}
            onClick={() => setStatus(isApproved ? 'new' : 'approved')}
            style={isApproved ? { background: 'var(--green-soft)', color: 'var(--green)', fontWeight: 600 } : undefined}
          >
            <Check /> {isApproved ? 'Approved' : 'Approve lead'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={statusPending}
            onClick={() => setStatus(isRejected ? 'new' : 'rejected')}
            style={isRejected ? { background: 'var(--red-soft)', color: 'var(--red)', fontWeight: 600 } : undefined}
          >
            <X /> {isRejected ? 'Rejected' : 'Reject'}
          </button>
          <button className="icon-btn bordered" aria-label="More options">
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      <div className="ld-layout">
        <div>
          <div className="card ld-company-card">
            <span className="ld-logo">{lead.initials}</span>
            <div>
              <div className="ld-company-name">{lead.name}</div>
              <div className="ld-company-desc">{lead.description}</div>
              <div className="ld-badges">
                {lead.email && (
                  <span className="pill pill-green">
                    <Check size={11} /> Email found
                  </span>
                )}
                {lead.phone && (
                  <span className="pill pill-green">
                    <Check size={11} /> Phone found
                  </span>
                )}
                {lead.website && (
                  <span className="pill pill-green">
                    <Check size={11} /> Website active
                  </span>
                )}
                {isApproved && (
                  <span className="pill pill-green">
                    <CheckCircle2 size={11} /> Approved
                  </span>
                )}
                {isRejected && (
                  <span className="pill pill-orange">
                    <XCircle size={11} /> Rejected
                  </span>
                )}
              </div>
            </div>
            <div className="ld-metrics">
              <div className="ld-metric">
                <div className="ld-metric-value">{lead.score}</div>
                <div className="ld-metric-label">Fit score</div>
                <span className={`pill ${scorePillClass(lead.scoreTone)}`}>{lead.scoreLabel}</span>
              </div>
              <div className="ld-metric">
                <div className="ld-metric-value">{lead.contactability}</div>
                <div className="ld-metric-label">Contactability</div>
                <span className="pill pill-blue">{lead.contactability >= 60 ? 'Good' : 'Fair'}</span>
              </div>
              <div className="ld-metric">
                <div className="ld-metric-value" style={{ fontSize: '1.25rem' }}>
                  {lead.confidence}
                </div>
                <div className="ld-metric-label">Confidence</div>
                <span className={`pill pill-${CONFIDENCE_TONE[lead.confidence] ?? 'blue'}`}>
                  {lead.confidence} confidence
                </span>
              </div>
              <div className="ld-sources">
                <div className="ld-source-row">
                  <FileSearch />
                  <span>
                    <span className="ld-source-label">Sources</span>
                    {lead.sourcesScanned.length > 0
                      ? `${lead.sourcesScanned.length} scanned`
                      : 'Web search'}
                  </span>
                </div>
                <div className="ld-source-row">
                  <MapPin />
                  <span>
                    <span className="ld-source-label">Location</span>
                    {lead.location || '—'}
                  </span>
                </div>
                <div className="ld-source-row">
                  <Globe />
                  <span>
                    <span className="ld-source-label">Website</span>
                    <a
                      href={websiteHref(lead.website)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--blue)' }}
                    >
                      {lead.website}
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card ld-section">
            <div className="ld-section-head">
              <span className="head-icon">
                <Check />
              </span>
              Why it matches
            </div>
            <div className="ld-match-grid">
              <div>
                {lead.why.length > 0 ? (
                  lead.why.map((reason, index) => {
                    const { icon: Icon, tone } = MATCH_ICONS[index % MATCH_ICONS.length];
                    return (
                      <div key={reason} className="match-item">
                        <span className={`icon-tile ${tone}`}>
                          <Icon />
                        </span>
                        <div>
                          <div className="match-item-text">{reason}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
                    The agent did not record specific match reasons for this lead.
                  </p>
                )}
              </div>
              <div>
                <div className="evidence-title">Evidence from website</div>
                {lead.evidence.length > 0 ? (
                  lead.evidence.map((item) => (
                    <div key={item.source + item.quote} className="evidence-quote">
                      <span className="q">“</span>
                      <span>{item.quote}</span>
                      <a
                        className="evidence-src-btn"
                        href={
                          /^https?:\/\//i.test(item.source)
                            ? item.source
                            : websiteHref(lead.website)
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.source} <ExternalLink />
                      </a>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
                    No page excerpts were captured for this lead.
                  </p>
                )}
              </div>
            </div>
            {timeline.length > 0 ? (
              <>
                <div className="evidence-title" style={{ marginTop: 10 }}>
                  Evidence timeline (sources scanned)
                </div>
                <div className="ld-timeline">
                  {timeline.map((node, i) => (
                    <span key={node.label} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {i > 0 && <span className="ld-timeline-line" />}
                      <span className="ld-timeline-node">
                        <CheckCircle2 />
                        {node.label}
                      </span>
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {warnings.length > 0 ? (
            <div className="warn-card">
              <div className="warn-head">
                <AlertTriangle /> Missing or uncertain information
              </div>
              <div className="warn-grid">
                {warnings.map(({ icon: Icon, title }) => (
                  <div key={title} className="warn-item">
                    <Icon />
                    <span>
                      <span className="warn-item-title">{title}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="next-card">
            <div className="next-head">
              <span className="next-head-title">
                <span className="spark">
                  <Sparkles />
                </span>
                Best next move: {move.label}
              </span>
              {move.reason}
            </div>
            <div className="next-grid">
              {NEXT_STEPS.map(({ action, icon: Icon, color, title, text }) => {
                const recommended = action !== null && action === move.action;
                return (
                  <button
                    key={title}
                    type="button"
                    className={`next-option${recommended ? ' recommended' : ''}`}
                    onClick={() => {
                      if (action === 'email' || action === 'call') setShowOutreach(true);
                      if (action === null) setStatus(isRejected ? 'new' : 'rejected');
                    }}
                  >
                    <Icon className="opt-icon" style={{ color }} />
                    <span className="next-option-title">
                      {title}
                      {recommended && <span className="next-option-badge">Recommended</span>}
                    </span>
                    <span className="next-option-text">{text}</span>
                    <ChevronRight className="chev" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card notes-card">
            <div className="notes-field">
              <div className="notes-label">
                <MessageSquare /> Notes
              </div>
              <input className="notes-input" placeholder="Add your observation or outreach strategy note…" />
            </div>
            <div>
              <div className="notes-label">Status</div>
              <button
                className="select-control"
                style={{
                  background: isRejected ? 'var(--red-soft)' : 'var(--green-soft)',
                  borderColor: 'var(--border)',
                  color: isRejected ? 'var(--red)' : 'var(--green)',
                  fontWeight: 600,
                }}
              >
                {isApproved || isRejected ? STATUS_LABELS[lead.status] : lead.scoreLabel}{' '}
                <ChevronDown />
              </button>
            </div>
            <div>
              <div className="notes-label">Add note</div>
              <button className="icon-btn bordered" aria-label="Add note">
                <StickyNote size={16} />
              </button>
            </div>
          </div>
        </div>

        <aside className="ld-side">
          <div className="card side-card">
            <div className="side-title">Contact &amp; Intelligence</div>
            <div className="side-field">
              <Mail />
              <span>
                <span className="side-field-label">Email</span>
                {lead.email || '—'}
              </span>
              <Copy size={14} className="copy" />
            </div>
            <div className="side-field">
              <Phone />
              <span>
                <span className="side-field-label">Phone</span>
                {lead.phone || '—'}
              </span>
              <Copy size={14} className="copy" />
            </div>
            <div className="side-field">
              <Globe />
              <span>
                <span className="side-field-label">Website</span>
                <a
                  href={websiteHref(lead.website)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--blue)' }}
                >
                  {lead.website || '—'}
                </a>
              </span>
              <ExternalLink size={14} className="copy" />
            </div>
          </div>

          <div className="card side-card">
            <div className="side-title">Company facts</div>
            <dl style={{ margin: 0 }}>
              {facts.map((fact) => (
                <div key={fact.label} className="facts-row">
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {lead.why.length > 0 ? (
            <div className="card side-card" style={{ background: 'var(--green-soft)', borderColor: 'var(--border)' }}>
              <div className="side-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={15} style={{ color: 'var(--green)' }} /> AI reasoning summary
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: 12 }}>
                {lead.why.join(' ')}
              </p>
              <span className={`pill ${scorePillClass(lead.scoreTone)}`}>{lead.scoreLabel} potential</span>
            </div>
          ) : null}

          <div className="ld-side-actions">
            <div className="row">
              <button type="button" className="btn btn-primary" onClick={() => setShowOutreach(true)}>
                <Mail /> Draft outreach
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={statusPending}
                onClick={() => setStatus(isApproved ? 'new' : 'approved')}
                style={isApproved ? { background: 'var(--green-soft)', color: 'var(--green)', fontWeight: 600 } : undefined}
              >
                <Check /> {isApproved ? 'Approved' : 'Approve'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={statusPending}
                onClick={() => setStatus(isRejected ? 'new' : 'rejected')}
                style={isRejected ? { background: 'var(--red-soft)', color: 'var(--red)', fontWeight: 600 } : undefined}
              >
                <X /> {isRejected ? 'Rejected' : 'Reject'}
              </button>
            </div>
            <Link to="/discover" className="btn btn-ghost" style={{ justifySelf: 'center' }}>
              <Search size={15} /> Back to Discover
            </Link>
          </div>
        </aside>
      </div>

      {showOutreach && (
        <OutreachDraftPanel
          lead={lead}
          missionName={mission?.name}
          onClose={() => setShowOutreach(false)}
        />
      )}
    </div>
  );
}
