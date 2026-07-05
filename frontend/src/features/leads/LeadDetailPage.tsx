import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  Users,
  MapPin,
  Mail,
  Phone,
  XCircle,
  Globe,
  ExternalLink,
  CheckCircle2,
  Copy,
  X,
  Zap,
  Target,
} from 'lucide-react';
import type { ElementType } from 'react';
import { useLead, useUpdateLeadStatus } from './use-leads-api-queries';
import { NetworkMemberBadge } from './NetworkMemberBadge';
import './network-member-badge.css';
import { useMission } from '../missions/use-missions-api-queries';
import { OutreachDraftPanel } from '../outreach/OutreachDraftPanel';
import './lead-detail.css';

const MATCH_ICONS: { icon: ElementType; tone: string }[] = [
  { icon: Target, tone: 'blue' },
  { icon: Users, tone: 'green' },
  { icon: MapPin, tone: 'purple' },
  { icon: Zap, tone: 'orange' },
];

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
        </div>
      </div>

      <div className="ld-layout">
        <div>
          <div className="card ld-company-card">
            <span className="ld-logo">{lead.initials}</span>
            <div>
              <div className="ld-company-name">{lead.name}</div>
              <NetworkMemberBadge lead={lead} size="md" showPitch />
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
