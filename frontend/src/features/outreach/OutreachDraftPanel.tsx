import { useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Lightbulb,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  Users,
  X,
} from 'lucide-react';
import { bestNextMove } from '../leads/best-next-move';
import type { LeadVM } from '../leads/use-leads-api-queries';
import { generateOutreachDraft, wordCount } from './generate-outreach-draft';
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

export function OutreachDraftPanel({ lead, missionName, onClose }: OutreachDraftPanelProps) {
  const move = useMemo(() => bestNextMove(lead), [lead]);
  const [channel, setChannel] = useState<OutreachChannel>(
    move.channel ?? (lead.email ? 'email' : 'call'),
  );
  const [angle, setAngle] = useState<OutreachAngle>('missed_calls');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [draftMeta, setDraftMeta] = useState<OutreachDraftVM | null>(null);

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

  const words = wordCount(body);

  const regenerate = () => {
    outreachDraft.mutate(
      { leadId: lead.id, channel, angle },
      {
        onSuccess: (draft) => {
          setSubject(draft.subject);
          setBody(draft.body);
          setDraftMeta(draft);
        },
      },
    );
  };

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
          <div className="outreach-foot-actions">
            <button type="button" className="btn btn-primary" disabled={isGenerating}>
              <Send size={14} />
              Send outreach
              <ExternalLink size={13} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
