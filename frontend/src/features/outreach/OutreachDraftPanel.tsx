import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSearch,
  Lightbulb,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { fitColor } from '@components/ScoreRing';
import { bestNextMove } from '../leads/best-next-move';
import type { LeadVM } from '../leads/use-leads-api-queries';
import { generateOutreachDraft, wordCount } from './generate-outreach-draft';
import { scoreOutreachDraft } from './score-outreach';
import {
  OUTREACH_CHANNEL_LABELS,
  type OutreachChannel,
} from './outreach-types';
import {
  OUTREACH_ANGLE_LABELS,
  useOutreachDraft,
  type OutreachAngle,
  type OutreachDraftVM,
} from './use-outreach-api-queries';
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
  const move = useMemo(() => bestNextMove(lead), [lead]);
  const [channel, setChannel] = useState<OutreachChannel>(
    move.channel ?? (lead.email ? 'email' : 'call'),
  );
  const [angle, setAngle] = useState<OutreachAngle>('missed_calls');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [draftMeta, setDraftMeta] = useState<OutreachDraftVM | null>(null);
  const [copied, setCopied] = useState(false);

  const outreachDraft = useOutreachDraft();
  const isGenerating = outreachDraft.isPending;

  useEffect(() => {
    outreachDraft.mutate(
      { leadId: lead.id, channel, angle },
      {
        onSuccess: (draft) => {
          setSubject(draft.subject);
          setBody(draft.body);
          setDraftMeta(draft);
          setCopied(false);
        },
        onError: () => {
          const fallback = generateOutreachDraft(lead, channel, missionName);
          setSubject(fallback.subject);
          setBody(fallback.body);
          setDraftMeta(null);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, channel, angle]);

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

  const topTips = useMemo(
    () => outreachScore.tips.filter((tip) => tip.severity !== 'good').slice(0, 2),
    [outreachScore.tips],
  );

  const words = wordCount(body);

  const regenerate = () => {
    outreachDraft.mutate(
      { leadId: lead.id, channel, angle },
      {
        onSuccess: (draft) => {
          setSubject(draft.subject);
          setBody(draft.body);
          setDraftMeta(draft);
          setCopied(false);
        },
      },
    );
  };

  const copyDraft = async () => {
    const text = channel === 'email' ? `Subject: ${subject}\n\n${body}` : body;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const whyNow = draftMeta?.why_now || lead.why[0] || '';
  const evidenceUsed = draftMeta?.evidence_used?.length
    ? draftMeta.evidence_used
    : lead.why.slice(0, 2);

  return (
    <div className="outreach-overlay" role="presentation" onClick={onClose}>
      <div
        className="outreach-panel outreach-panel-compact card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="outreach-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="outreach-panel-head">
          <div>
            <div className="outreach-panel-eyebrow">
              <Sparkles size={13} /> AI-drafted outreach
            </div>
            <h2 id="outreach-panel-title" className="outreach-panel-title">
              {lead.name}
            </h2>
            <p className="outreach-panel-subtitle">
              <MapPin size={12} /> {lead.location}
              <span className={`pill ${scorePill[lead.scoreTone]}`} style={{ marginLeft: 10 }}>
                {lead.score} fit
              </span>
              {lead.email ? (
                <span className="outreach-head-contact">
                  <Mail size={12} /> {lead.email}
                </span>
              ) : lead.phone ? (
                <span className="outreach-head-contact">
                  <Phone size={12} /> {lead.phone}
                </span>
              ) : null}
            </p>
          </div>
          <button type="button" className="icon-btn bordered" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="outreach-compact-body">
          {whyNow ? (
            <div className="outreach-why-now">
              <Zap size={14} />
              <span>
                <strong>Why now:</strong> {whyNow}
              </span>
            </div>
          ) : null}

          {move.channel ? (
            <div className="outreach-reco-line">
              <Sparkles size={13} />
              <span>
                <strong>Best next move — {move.label}:</strong> {move.reason}
              </span>
            </div>
          ) : null}

          <div className="outreach-controls-row">
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
                  {move.channel === key && (
                    <span className="outreach-channel-reco" title={move.reason}>
                      ★
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="outreach-angle-tabs">
              <span className="outreach-angle-label">Angle</span>
              {(Object.keys(OUTREACH_ANGLE_LABELS) as OutreachAngle[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`outreach-angle-tab${angle === key ? ' active' : ''}`}
                  onClick={() => setAngle(key)}
                >
                  {OUTREACH_ANGLE_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="outreach-compose card">
            <div className="outreach-compose-head">
              <span className="outreach-compose-title">
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="outreach-spin" /> AI is writing…
                  </>
                ) : (
                  <>Draft · {words} words</>
                )}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={regenerate}
                disabled={isGenerating}
              >
                <RefreshCw size={13} /> Regenerate
              </button>
            </div>

            <div className={`outreach-compose-fields${isGenerating ? ' generating' : ''}`}>
              {(channel === 'email' || channel === 'call') && (
                <input
                  className="outreach-input"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder={channel === 'email' ? 'Subject line' : 'Call script title'}
                  disabled={isGenerating}
                />
              )}

              <textarea
                className="outreach-textarea"
                value={isGenerating ? '' : body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={isGenerating ? 'Generating a personalized draft from verified signals…' : ''}
                spellCheck
                rows={9}
                disabled={isGenerating}
              />
            </div>
          </div>

          {evidenceUsed.length > 0 && !isGenerating ? (
            <div className="outreach-evidence-row">
              <FileSearch size={13} />
              <span className="outreach-evidence-row-label">Facts used:</span>
              {evidenceUsed.map((fact) => (
                <span key={fact} className="outreach-evidence-chip">
                  <Check size={11} /> {fact}
                </span>
              ))}
            </div>
          ) : null}

          {topTips.length > 0 && !isGenerating ? (
            <div className="outreach-tips-row">
              {topTips.map((tip) => {
                const Icon = tipIcon[tip.severity];
                return (
                  <span key={tip.id} className={`outreach-tip-chip ${tip.severity}`}>
                    <Icon size={12} /> {tip.detail}
                  </span>
                );
              })}
            </div>
          ) : null}

          {draftMeta && draftMeta.followup_plan.length > 0 && !isGenerating ? (
            <div className="outreach-plan">
              <div className="outreach-plan-title">
                <Lightbulb size={13} /> Follow-up plan if no reply
              </div>
              {draftMeta.followup_plan.map((touch) => (
                <div key={`${touch.day}-${touch.goal}`} className="outreach-plan-touch">
                  <span className="outreach-plan-day">Day {touch.day}</span>
                  <span className="outreach-plan-channel">
                    {touch.channel === 'call' && <Phone size={11} />}
                    {touch.channel === 'email' && <Mail size={11} />}
                    {touch.channel === 'linkedin' && <Users size={11} />}
                    {touch.channel}
                  </span>
                  <span className="outreach-plan-idea">
                    <strong>{touch.goal}:</strong> {touch.message_idea}
                  </span>
                </div>
              ))}
            </div>
          ) : draftMeta?.followup_hint && !isGenerating ? (
            <div className="outreach-followup">
              <Lightbulb size={13} /> <strong>If no reply:</strong> {draftMeta.followup_hint}
            </div>
          ) : null}
        </div>

        <footer className="outreach-panel-foot">
          <div className="outreach-foot-meta">
            {missionName && <span className="outreach-mission-pill">{missionName}</span>}
            <span
              className="outreach-score-inline"
              style={{ color: fitColor(outreachScore.score) }}
              title="Based on personalization, length, CTA clarity, and contact readiness"
            >
              {outreachScore.score} · {outreachScore.label}
            </span>
          </div>
          <div className="outreach-foot-actions">
            <button type="button" className="btn btn-outline" onClick={copyDraft} disabled={isGenerating}>
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
            </button>
            <button type="button" className="btn btn-primary" disabled={isGenerating}>
              <Send size={14} />
              {channel === 'call' ? 'Log call' : 'Send outreach'}
              <ExternalLink size={13} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
