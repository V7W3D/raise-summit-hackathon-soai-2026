import { Link, useParams } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  MessageSquare,
  MoreHorizontal,
  Droplets,
  Users,
  MapPin,
  Contact,
  AlertTriangle,
  UserX,
  Mail,
  HelpCircle,
  Sparkles,
  Search,
  Phone,
  Bookmark,
  XCircle,
  Globe,
  FileSearch,
  ExternalLink,
  CheckCircle2,
  Circle,
  Copy,
  X,
  StickyNote,
  ChevronDown,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { useLead } from './use-leads-api-queries';
import './lead-detail.css';

function Linkedin({ size = 16, style, className }: { size?: number; style?: CSSProperties; className?: string }) {
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        background: style?.color ?? '#0a66c2',
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

const MATCH_ITEMS = [
  {
    icon: Droplets,
    tone: 'blue',
    title: 'Relevant activity detected',
    text: 'Emergency plumbing, repair services, local intervention.',
  },
  {
    icon: Users,
    tone: 'green',
    title: 'Likely need for your service',
    text: 'Phone-first workflow, high inbound call volume, small service team, local customer acquisition.',
  },
  {
    icon: MapPin,
    tone: 'purple',
    title: 'Location match',
    text: 'Operates in Lyon and surrounding areas.',
  },
  {
    icon: Contact,
    tone: 'orange',
    title: 'Contact point found',
    text: 'Generic email and primary phone number identified.',
  },
];

const EVIDENCE = [
  { quote: '“Plombier à Lyon – Intervention rapide 24h/24 et 7j/7 pour tous vos dépannages de plomberie.”', source: 'Homepage' },
  { quote: '“Dépannage plomberie, réparation de fuites, installation sanitaire, chauffe-eau, débouchage canalisation.”', source: 'Services' },
  { quote: '“Contactez-nous au 04 78 123 456 pour une intervention rapide. Devis gratuit.”', source: 'Contact page' },
];

const TIMELINE = [
  { label: 'Homepage', done: true },
  { label: 'About', done: true },
  { label: 'Services', done: true },
  { label: 'Contact page', done: true },
  { label: 'Directories', done: false },
];

const WARNINGS = [
  { icon: UserX, title: 'No named decision-maker', text: 'No specific person identified on the website or directories.' },
  { icon: Mail, title: 'Generic email only', text: 'Email is generic (info/contact), not person-specific.' },
  { icon: HelpCircle, title: 'Unclear business size', text: 'No clear headcount or team size information.' },
  { icon: Linkedin, title: 'No LinkedIn decision-maker', text: 'No company decision-maker identified on LinkedIn.' },
];

const NEXT_STEPS = [
  { icon: Mail, color: '#2563eb', title: 'Draft email', text: 'Create a short, value-first outreach email.' },
  { icon: Linkedin, color: '#0a66c2', title: 'Search LinkedIn', text: 'Find decision-makers on LinkedIn.' },
  { icon: Phone, color: '#16a34a', title: 'Call directly', text: 'Call the main number (04 78 123 456).' },
  { icon: Bookmark, color: '#7c5cf0', title: 'Save for later', text: 'Add to a list and follow up later.' },
  { icon: XCircle, color: '#dc2626', title: 'Reject lead', text: 'Not a good fit right now.' },
];

const CONFIDENCE_TONE: Record<string, string> = {
  High: 'green',
  Medium: 'blue',
  Low: 'orange',
};

function scorePillClass(tone: string): string {
  return `pill-${tone}`;
}

export function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const { data: lead, isPending, isError } = useLead(leadId);

  if (isPending) {
    return <p className="page-subtitle">Loading…</p>;
  }

  if (isError || !lead) {
    return <p className="page-subtitle">Lead not found.</p>;
  }

  const timeline =
    lead.sourcesScanned.length > 0
      ? lead.sourcesScanned.map((s) => ({ label: s.label.replace(/ scanned$/, ''), done: true }))
      : TIMELINE;

  const warnings =
    lead.missing.length > 0
      ? lead.missing.map((m) => ({ icon: AlertTriangle, title: m, text: '' }))
      : WARNINGS;

  const facts = [
    { label: 'Industry', value: lead.industry || '—' },
    { label: 'Employees (est.)', value: lead.employees || '—' },
    { label: 'Service area', value: lead.serviceArea || '—' },
    { label: 'Business type', value: lead.businessType || '—' },
    { label: 'Founded', value: '—' },
    { label: 'Last scanned', value: lead.sourcesScanned[0]?.time ?? '—' },
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
            <Link to="/discover">Construction Clients – Lyon</Link>
            <ChevronRight />
            <span className="current">{lead.name}</span>
          </nav>
        </div>
        <div className="discover-header-actions" style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary">
            <Check /> Approve lead
          </button>
          <button className="btn btn-outline">
            <MessageSquare /> Request more info
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
                    Website, Directories, Maps
                  </span>
                </div>
                <div className="ld-source-row">
                  <MapPin />
                  <span>
                    <span className="ld-source-label">Location</span>
                    {lead.location}
                  </span>
                </div>
                <div className="ld-source-row">
                  <Globe />
                  <span>
                    <span className="ld-source-label">Website</span>
                    <a href="#website" style={{ color: 'var(--blue)' }}>
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
                {MATCH_ITEMS.map(({ icon: Icon, tone, title, text }) => (
                  <div key={title} className="match-item">
                    <span className={`icon-tile ${tone}`}>
                      <Icon />
                    </span>
                    <div>
                      <div className="match-item-title">{title}</div>
                      <div className="match-item-text">{text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="evidence-title">Evidence from website</div>
                {(lead.evidence.length > 0 ? lead.evidence : EVIDENCE).map((item) => (
                  <div key={item.source + item.quote} className="evidence-quote">
                    <span className="q">“</span>
                    <span>{item.quote}</span>
                    <button className="evidence-src-btn">
                      {item.source} <ExternalLink />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="evidence-title" style={{ marginTop: 10 }}>
              Evidence timeline (sources scanned)
            </div>
            <div className="ld-timeline">
              {timeline.map((node, i) => (
                <span key={node.label} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {i > 0 && <span className="ld-timeline-line" />}
                  <span className={`ld-timeline-node${node.done ? '' : ' pending'}`}>
                    {node.done ? <CheckCircle2 /> : <Circle />}
                    {node.label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="warn-card">
            <div className="warn-head">
              <AlertTriangle /> Missing or uncertain information
            </div>
            <div className="warn-grid">
              {warnings.map(({ icon: Icon, title, text }) => (
                <div key={title} className="warn-item">
                  <Icon />
                  <span>
                    <span className="warn-item-title">{title}</span>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="next-card">
            <div className="next-head">
              <span className="next-head-title">
                <span className="spark">
                  <Sparkles />
                </span>
                Recommended next step
              </span>
              Recommended next step: send a short value-first email, then call if no reply within 3 days.
            </div>
            <div className="next-grid">
              {NEXT_STEPS.map(({ icon: Icon, color, title, text }) => (
                <button key={title} className="next-option">
                  <Icon className="opt-icon" style={{ color }} />
                  <span className="next-option-title">{title}</span>
                  <span className="next-option-text">{text}</span>
                  <ChevronRight className="chev" />
                </button>
              ))}
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
              <div className="notes-label">Assign status</div>
              <button className="select-control" style={{ background: 'var(--green-soft)', borderColor: '#cdebd8', color: 'var(--green)', fontWeight: 600 }}>
                High fit <ChevronDown />
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
                <a href="#website" style={{ color: 'var(--blue)' }}>
                  {lead.website || '—'}
                </a>
              </span>
              <ExternalLink size={14} className="copy" />
            </div>
            <div className="side-field">
              <Users />
              <span>
                <span className="side-field-label">Social</span>
                <span style={{ display: 'inline-flex', gap: 10, marginTop: 4 }}>
                  <Linkedin size={17} style={{ color: '#0a66c2' }} />
                  <span
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: '50%',
                      background: '#1877f2',
                      color: '#fff',
                      display: 'inline-grid',
                      placeItems: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    f
                  </span>
                  <span style={{ color: '#e4405f', fontWeight: 700, fontSize: 13 }}>◎</span>
                </span>
              </span>
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

          <div className="card side-card" style={{ background: '#f2fbf5', borderColor: '#cdebd8' }}>
            <div className="side-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={15} style={{ color: 'var(--green)' }} /> AI reasoning summary
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: 12 }}>
              {lead.aiSummary ||
                'Strong local fit with emergency service positioning and phone-first workflow.'}
            </p>
            <span className={`pill ${scorePillClass(lead.scoreTone)}`}>{lead.scoreLabel} potential</span>
          </div>

          <div className="ld-side-actions">
            <div className="row">
              <button className="btn btn-primary">
                <Check /> Approve
              </button>
              <button className="btn btn-outline">
                <X /> Reject
              </button>
            </div>
            <button className="btn btn-outline">
              <MessageSquare /> Request more info
            </button>
            <Link to="/discover" className="btn btn-ghost" style={{ justifySelf: 'center' }}>
              <Search size={15} /> Back to Discover
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
