import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  X,
  Clock,
  FileSearch,
  Users,
} from 'lucide-react';
import { ScoreRing, fitColor } from '@components/ScoreRing';
import type { LeadVM } from '../leads/use-leads-api-queries';
import { generateOutreachDraft, wordCount } from './generate-outreach-draft';
import { buildLeadVerification, verificationPillClass } from './lead-verification';
import { outreachScoreColor, scoreOutreachDraft } from './score-outreach';
import {
  OUTREACH_CHANNEL_LABELS,
  type OutreachChannel,
} from './outreach-types';
import './outreach-draft.css';

type OutreachDraftPanelProps = {
  lead: LeadVM;
  missionName?: string;
  onClose: () => void;
};

const scorePill: Record<LeadVM['scoreTone'], string> = {
  green: 'pill-green',
  blue: 'pill-blue',
  orange: 'pill-orange',
};

const tipIcon = {
  good: CheckCircle2,
  warning: AlertCircle,
  improve: Lightbulb,
};

export function OutreachDraftPanel({ lead, missionName, onClose }: OutreachDraftPanelProps) {
  const [channel, setChannel] = useState<OutreachChannel>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);

  const verification = useMemo(() => buildLeadVerification(lead), [lead]);

  useEffect(() => {
    const draft = generateOutreachDraft(lead, channel, missionName);
    setSubject(draft.subject);
    setBody(draft.body);
    setCopied(false);
  }, [lead, channel, missionName]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const outreachScore = useMemo(
    () => scoreOutreachDraft(lead, channel, subject, body),
    [lead, channel, subject, body],
  );

  const words = wordCount(body);

  const copyDraft = async () => {
    const text = channel === 'email' ? `Subject: ${subject}\n\n${body}` : body;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="outreach-overlay" role="presentation" onClick={onClose}>
      <div
        className="outreach-panel card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="outreach-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="outreach-panel-head">
          <div>
            <div className="outreach-panel-eyebrow">
              <Sparkles size={13} /> AI-personalized outreach
            </div>
            <h2 id="outreach-panel-title" className="outreach-panel-title">
              Draft outreach for {lead.name}
            </h2>
            <p className="outreach-panel-subtitle">
              Pre-filled from verified signals · edit freely · score updates live
            </p>
          </div>
          <button type="button" className="icon-btn bordered" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="outreach-panel-body">
          <aside className="outreach-intel">
            <div className="outreach-intel-hero card">
              <div className="outreach-intel-identity">
                <span className="lead-logo" style={{ background: lead.logoColor, width: 44, height: 44 }}>
                  {lead.initials}
                </span>
                <div>
                  <div className="outreach-intel-name">{lead.name}</div>
                  <div className="outreach-intel-desc">{lead.description}</div>
                  <div className="outreach-intel-loc">
                    <MapPin size={12} /> {lead.location}
                  </div>
                </div>
              </div>

              <div className="outreach-intel-badges">
                <span className={`pill ${verificationPillClass(verification.status)}`}>
                  {verification.status === 'verified' && <Check size={11} />}
                  {verification.statusLabel}
                </span>
                <span className={`pill ${scorePill[lead.scoreTone]}`}>{lead.scoreLabel}</span>
              </div>

              <p className="outreach-intel-summary">{verification.summary}</p>

              <div className="outreach-intel-metrics">
                <div className="outreach-metric">
                  <ScoreRing value={lead.score} size={48} stroke={4} color={fitColor(lead.score)} fontSize={13} />
                  <span className="outreach-metric-label">Fit score</span>
                </div>
                <div className="outreach-metric">
                  <div className="outreach-metric-value">{lead.contactability}</div>
                  <span className="outreach-metric-label">Contactability</span>
                </div>
                <div className="outreach-metric">
                  <div className="outreach-metric-value">{lead.confidence}</div>
                  <span className="outreach-metric-label">Confidence</span>
                </div>
              </div>
            </div>

            <div className="outreach-intel-section card">
              <div className="outreach-section-title">
                <CheckCircle2 size={15} /> Verification checks
              </div>
              <ul className="outreach-check-list">
                {verification.checks.map((check) => (
                  <li key={check.id} className={`outreach-check${check.passed ? ' passed' : ''}`}>
                    <span className="outreach-check-icon">{check.passed ? <Check size={12} /> : <X size={12} />}</span>
                    <span>
                      <span className="outreach-check-label">{check.label}</span>
                      <span className="outreach-check-detail">{check.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="outreach-intel-section card">
              <div className="outreach-section-title">
                <Building2 size={15} /> Company profile
              </div>
              <dl className="outreach-facts">
                <div className="outreach-fact">
                  <dt>Industry</dt>
                  <dd>{lead.industry || '—'}</dd>
                </div>
                <div className="outreach-fact">
                  <dt>Employees</dt>
                  <dd>{lead.employees || '—'}</dd>
                </div>
                <div className="outreach-fact">
                  <dt>Service area</dt>
                  <dd>{lead.serviceArea || lead.location}</dd>
                </div>
                <div className="outreach-fact">
                  <dt>Website</dt>
                  <dd>{lead.website || '—'}</dd>
                </div>
              </dl>

              <div className="outreach-contact-rows">
                {lead.email && (
                  <div className="outreach-contact-row">
                    <Mail size={14} /> {lead.email}
                  </div>
                )}
                {lead.phone && (
                  <div className="outreach-contact-row">
                    <Phone size={14} /> {lead.phone}
                  </div>
                )}
              </div>
            </div>

            {lead.why.length > 0 && (
              <div className="outreach-intel-section card">
                <div className="outreach-section-title">Why this lead matches</div>
                {lead.why.map((reason) => (
                  <div key={reason} className="outreach-signal why">
                    <Check size={12} /> {reason}
                  </div>
                ))}
              </div>
            )}

            {lead.evidence.length > 0 && (
              <div className="outreach-intel-section card">
                <div className="outreach-section-title">
                  <FileSearch size={15} /> Evidence used in draft
                </div>
                {lead.evidence.slice(0, 2).map((item) => (
                  <div key={item.quote} className="outreach-evidence">
                    <span className="outreach-evidence-quote">“{item.quote}”</span>
                    <span className="outreach-evidence-source">{item.source}</span>
                  </div>
                ))}
              </div>
            )}

            {lead.missing.length > 0 && (
              <div className="outreach-intel-section card outreach-intel-warn">
                <div className="outreach-section-title">
                  <AlertCircle size={15} /> Gaps to be aware of
                </div>
                {lead.missing.map((item) => (
                  <div key={item} className="outreach-signal missing">
                    <AlertCircle size={12} /> {item}
                  </div>
                ))}
              </div>
            )}

            {lead.sourcesScanned.length > 0 && (
              <div className="outreach-intel-section card">
                <div className="outreach-section-title">
                  <Clock size={15} /> Scan timeline
                </div>
                {lead.sourcesScanned.map((event) => (
                  <div key={event.label} className="outreach-timeline-item">
                    <CheckCircle2 size={13} /> {event.label}
                    <span>{event.time}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>

          <section className="outreach-editor">
            <div className="outreach-channel-tabs">
              {(Object.keys(OUTREACH_CHANNEL_LABELS) as OutreachChannel[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`outreach-channel-tab${channel === key ? ' active' : ''}`}
                  onClick={() => setChannel(key)}
                >
                  {key === 'email' && <Mail size={14} />}
                  {key === 'linkedin' && <Users size={14} />}
                  {key === 'call' && <Phone size={14} />}
                  {OUTREACH_CHANNEL_LABELS[key]}
                </button>
              ))}
            </div>

            {lead.recommended.length > 0 && (
              <div className="outreach-recommended">
                <Lightbulb size={14} />
                <span>
                  <strong>Recommended approach:</strong> {lead.recommended.join(' · ')}
                </span>
              </div>
            )}

            <div className="outreach-compose card">
              <div className="outreach-compose-head">
                <span className="outreach-compose-title">Your draft</span>
                <span className="outreach-compose-meta">{words} words · edits update score live</span>
              </div>

              <div className="outreach-compose-fields">
                {(channel === 'email' || channel === 'call') && (
                  <label className="outreach-field">
                    <span className="outreach-field-label">
                      {channel === 'email' ? 'Subject line' : 'Script title'}
                    </span>
                    <input
                      className="outreach-input"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder={channel === 'email' ? 'Subject line' : 'Call script title'}
                    />
                  </label>
                )}

                <div className="outreach-field">
                  <span className="outreach-field-label">
                    {channel === 'call' ? 'Call script' : 'Message body'}
                  </span>
                  <div className="outreach-message-wrap">
                    <textarea
                      className="outreach-textarea"
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      spellCheck
                      rows={10}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="outreach-score-card card">
              <div className="outreach-score-head">
                <div>
                  <div className="outreach-section-title">Outreach quality score</div>
                  <p className="outreach-score-desc">Live tips based on personalization, length, tone, and contact readiness.</p>
                </div>
                <div className="outreach-score-ring">
                  <ScoreRing
                    value={outreachScore.score}
                    size={64}
                    stroke={5}
                    color={outreachScoreColor(outreachScore.score)}
                    fontSize={17}
                  />
                  <span className="outreach-score-label">{outreachScore.label}</span>
                </div>
              </div>

              <ul className="outreach-tips">
                {outreachScore.tips.map((tip) => {
                  const Icon = tipIcon[tip.severity];
                  return (
                    <li key={tip.id} className={`outreach-tip ${tip.severity}`}>
                      <Icon size={14} />
                      <span>
                        <span className="outreach-tip-title">{tip.title}</span>
                        <span className="outreach-tip-detail">{tip.detail}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>

        <footer className="outreach-panel-foot">
          <div className="outreach-foot-meta">
            {missionName && (
              <span className="outreach-mission-pill">
                <Building2 size={13} /> {missionName}
              </span>
            )}
            {lead.email && channel === 'email' && (
              <span className="outreach-send-to">
                Send to <strong>{lead.email}</strong>
              </span>
            )}
            {channel === 'call' && lead.phone && (
              <span className="outreach-send-to">
                Call <strong>{lead.phone}</strong>
              </span>
            )}
          </div>
          <div className="outreach-foot-actions">
            <button type="button" className="btn btn-outline" onClick={copyDraft}>
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy draft'}
            </button>
            <button type="button" className="btn btn-outline">
              Save draft
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={outreachScore.score < 50}
              title={outreachScore.score < 50 ? 'Improve score before sending' : undefined}
            >
              <Send size={14} />
              {channel === 'call' ? 'Log call & follow up' : 'Send outreach'}
              <ExternalLink size={13} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
