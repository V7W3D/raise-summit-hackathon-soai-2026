import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  Bookmark,
  MoreHorizontal,
  MoreVertical,
  Building2,
  ChevronDown,
  MapPin,
  X,
  Check,
  ArrowUpDown,
  CircleX,
  Search,
  Eye,
  Send,
  AlertCircle,
  Lightbulb,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

function BrandDot({ bg, label }: { bg: string; label: string }) {
  return (
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        background: bg,
        color: '#fff',
        display: 'inline-grid',
        placeItems: 'center',
        fontSize: 10,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}
import { ScoreRing, fitColor } from '@components/ScoreRing';
import { useLeads } from './use-discover-api-queries';
import type { LeadVM } from '../leads/use-leads-api-queries';
import './discover.css';

const TABS = ['High fit (18)', 'Promising but incomplete (16)', 'Needs verification (9)', 'Rejected (5)'];

const SOURCES = ['Websites', 'Directories', 'LinkedIn', 'Maps'];
const INDUSTRIES = ['Construction', 'Plumbing', 'Renovation', 'Roofing'];
const TOGGLES = ['Has contact info', 'Has website', 'Active / recently active'];
const SIZES = ['1–10', '10–50', '50–200'];
const ROLES = ['Owner', 'Operations', 'Office Manager'];

const scorePill: Record<LeadVM['scoreTone'], string> = {
  green: 'pill-green',
  blue: 'pill-blue',
  orange: 'pill-orange',
};

export function DiscoverPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const { data, isPending, isError } = useLeads();
  const discoverLeads = data ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const effectiveSelectedId = selectedId ?? discoverLeads[0]?.id;
  const selected =
    discoverLeads.find((lead) => lead.id === effectiveSelectedId) ?? discoverLeads[0];

  if (isPending) {
    return <p className="page-subtitle">Loading…</p>;
  }

  if (isError) {
    return <p className="page-subtitle">Unable to load leads.</p>;
  }

  return (
    <div>
      <div className="discover-header">
        <div>
          <div className="discover-title-row">
            <h1 className="page-title">Discover Leads</h1>
          </div>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            AI-assisted lead discovery &amp; verification for your mission.
            <span className="pill pill-blue">
              Evidence-backed ranking <Sparkles size={12} />
            </span>
          </p>
        </div>
        <div className="discover-header-actions">
          <span className="pill pill-green" style={{ padding: '8px 14px' }}>
            ● Mission active
          </span>
          <button className="btn btn-outline">
            <RefreshCw /> Run new search
          </button>
          <button className="btn btn-primary">
            <Bookmark /> Save shortlist
          </button>
          <button className="icon-btn bordered" aria-label="More options">
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      <div className="card mission-banner">
        <span className="icon-tile blue">
          <Building2 />
        </span>
        <div className="mission-banner-info">
          <div className="mission-banner-name">Construction Clients – Lyon</div>
          <div className="mission-banner-target">
            Target: small construction service businesses • Goal: find likely prospects for AI call reception
          </div>
        </div>
        <div className="mission-banner-stats">
          <div>
            <div className="mb-stat-value">48</div>
            <div className="mb-stat-label">Leads discovered</div>
          </div>
          <div>
            <div className="mb-stat-value">16</div>
            <div className="mb-stat-label">Shortlisted</div>
          </div>
          <div>
            <div className="mb-stat-value">7</div>
            <div className="mb-stat-label">Contacted</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <ScoreRing value={33} size={52} stroke={5} color="#2563eb" fontSize={12} label="33%" />
            <div className="mb-stat-label" style={{ marginTop: 4 }}>
              Mission progress
            </div>
          </div>
        </div>
      </div>

      <div className="discover-layout">
        <aside className="card filters-panel">
          <div className="filters-head">
            <span className="filters-head-title">Mission context &amp; filters</span>
            <a className="link" href="#reset" style={{ fontSize: '0.75rem' }}>
              Reset all
            </a>
          </div>

          <div className="filter-group">
            <div className="filter-label">Active mission</div>
            <div className="active-mission-card">
              <div className="active-mission-name">
                Construction Clients – Lyon <span className="active-mission-dot" />
              </div>
              <div className="active-mission-meta">
                Small construction service businesses
                <br />
                AI call reception solution
              </div>
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Sources</div>
            <div className="sources-grid">
              {SOURCES.map((source) => (
                <label key={source} className="checkbox">
                  <span className="checkbox-box checked">
                    <Check />
                  </span>
                  {source}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Location</div>
            <div className="location-chip">
              <MapPin /> Lyon, France <X size={14} className="close" />
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">
              Industry <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
            </div>
            <div className="tag-row">
              {INDUSTRIES.map((industry) => (
                <span key={industry} className="filter-tag">
                  {industry} <X />
                </span>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Fit score range</div>
            <div className="range-labels">
              <span>60</span>
              <span>100</span>
            </div>
            <div className="range-track">
              <div className="range-fill" />
              <div className="range-handle" style={{ left: '8%' }} />
              <div className="range-handle" style={{ left: '94%' }} />
            </div>
          </div>

          <div className="filter-group">
            {TOGGLES.map((toggle) => (
              <div key={toggle} className="toggle-row">
                {toggle}
                <span className="switch on" />
              </div>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-label">Business size (employees)</div>
            <div className="seg-row">
              {SIZES.map((size, i) => (
                <button key={size} className={`seg-option${i === 0 ? ' selected' : ''}`}>
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group" style={{ marginBottom: 0 }}>
            <div className="filter-label">Role type</div>
            <div className="seg-row">
              {ROLES.map((role, i) => (
                <button key={role} className={`seg-option${i === 0 ? ' selected' : ''}`}>
                  {role}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="leads-column">
          <div className="leads-tabs">
            {TABS.map((tab) => (
              <button key={tab} className={`leads-tab${tab === activeTab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
            <button className="select-control sort-btn" style={{ padding: '7px 12px', fontSize: '0.7813rem' }}>
              <ArrowUpDown /> Sort by fit score <ChevronDown />
            </button>
          </div>
          <div className="leads-count">18 results</div>

          {discoverLeads.map((lead) => {
            const isSelected = lead.id === effectiveSelectedId;
            return (
              <div
                key={lead.id}
                className={`card lead-card${isSelected ? ' selected' : ''}`}
                onClick={() => setSelectedId(lead.id)}
              >
                <div className="lead-card-main">
                  <span className={`lead-radio${isSelected ? ' checked' : ''}`} />
                  <div className="lead-identity">
                    <span className="lead-logo" style={{ background: lead.logoColor }}>
                      {lead.initials}
                    </span>
                    <div>
                      <div className="lead-name">{lead.name}</div>
                      <div className="lead-desc">{lead.description}</div>
                      <div className="lead-loc">
                        <MapPin /> {lead.location}
                      </div>
                      <div className="lead-loc">
                        <ExternalLink /> {lead.website}
                      </div>
                      <span className="lead-contact-badge">{lead.contactBadge}</span>
                    </div>
                  </div>

                  <div className="lead-score">
                    <ScoreRing value={lead.score} size={62} stroke={5} color={fitColor(lead.score)} fontSize={17} />
                    <span className={`pill ${scorePill[lead.scoreTone]}`}>{lead.scoreLabel}</span>
                  </div>

                  <div className="lead-cols">
                    <div>
                      <div className="lead-col-title">Why</div>
                      {lead.why.map((reason) => (
                        <div key={reason} className="lead-col-item why">
                          <Check /> {reason}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="lead-col-title">Missing</div>
                      {lead.missing.map((item) => (
                        <div key={item} className="lead-col-item missing">
                          <AlertCircle /> {item}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="lead-col-title">Recommended</div>
                      {lead.recommended.map((item) => (
                        <div key={item} className="lead-col-item rec">
                          <Lightbulb /> {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {!isSelected && <MoreVertical size={16} className="lead-more" />}
                </div>

                {isSelected && (
                  <div className="lead-actions">
                    <button className="btn btn-outline btn-sm">
                      <Bookmark size={14} /> Save
                    </button>
                    <button className="btn btn-outline btn-sm">
                      <CircleX size={14} /> Reject
                    </button>
                    <button className="btn btn-outline btn-sm">
                      <Search size={14} /> Investigate more
                    </button>
                    <Link to={`/leads/${lead.id}`} className="btn btn-outline btn-sm">
                      <Eye size={14} /> Open details
                    </Link>
                    <button className="btn btn-primary btn-sm">
                      <Send size={14} /> Draft outreach
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="lead-panel-wrap">
          {selected ? (
          <aside className="card lead-panel">
            <div className="lead-panel-head">
              <span className="pill pill-blue">Selected lead</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pill pill-purple">
                  AI-verified <Sparkles size={11} />
                </span>
                <X size={15} style={{ color: 'var(--faint)' }} />
              </span>
            </div>

            <div className="lead-panel-identity">
              <span className="lead-logo" style={{ background: selected.logoColor, width: 46, height: 46 }}>
                {selected.initials}
              </span>
              <div>
                <div className="lead-panel-name">{selected.name}</div>
                <div className="lead-panel-desc">{selected.description}</div>
              </div>
              <div className="lead-panel-score">
                <ScoreRing value={selected.score} size={54} stroke={5} color={fitColor(selected.score)} fontSize={15} />
                <span className={`pill ${scorePill[selected.scoreTone]}`}>{selected.scoreLabel}</span>
              </div>
            </div>

            <div className="lead-panel-section-title">Website evidence summary</div>
            <p className="lead-panel-text">
              We scanned {selected.website} and found strong signals of local activity, emergency service, and
              phone-first operations.
            </p>

            <div className="lead-panel-section-title">Key evidence snippets</div>
            {selected.evidence.length > 0 ? (
              selected.evidence.map((snippet) => (
                <div key={snippet.quote} className="snippet">
                  <span className="snippet-quote">“</span>
                  <span>{snippet.quote}</span>
                  <span className="snippet-source">{snippet.source}</span>
                </div>
              ))
            ) : (
              <p className="lead-panel-text">No evidence snippets captured yet.</p>
            )}

            <div className="lead-panel-section-title" style={{ marginTop: 16 }}>
              Contact information
            </div>
            {selected.email && (
              <div className="contact-row">
                <Mail /> {selected.email} <span className="pill pill-neutral">Generic</span>
              </div>
            )}
            {selected.phone && (
              <div className="contact-row">
                <Phone /> {selected.phone} <span className="pill pill-green">Primary</span>
              </div>
            )}
            {!selected.email && !selected.phone && (
              <p className="lead-panel-text">No contact details found yet.</p>
            )}
            <button className="btn btn-primary btn-sm" style={{ margin: '8px 0 16px', width: '100%' }}>
              Open source page <ExternalLink size={13} />
            </button>

            <div className="lead-panel-section-title">Social presence</div>
            <div className="social-row">
              <span className="social-chip">
                <BrandDot bg="#0a66c2" label="in" /> LinkedIn
              </span>
              <span className="social-chip">
                <BrandDot bg="#1877f2" label="f" /> Facebook
              </span>
              <span className="social-chip">
                <BrandDot bg="#e4405f" label="◎" /> Instagram
              </span>
            </div>

            {selected.aiSummary && (
              <div className="ai-summary">
                <div className="ai-summary-head">
                  <CheckCircle2 size={15} /> AI reasoning summary
                </div>
                {selected.aiSummary}
              </div>
            )}

            {selected.sourcesScanned.length > 0 && (
              <>
                <div className="lead-panel-section-title">Evidence timeline</div>
                {selected.sourcesScanned.map((event) => (
                  <div key={event.label} className="timeline-item">
                    <CheckCircle2 /> {event.label}
                    <span className="time">{event.time}</span>
                  </div>
                ))}
              </>
            )}

            <div className="lead-panel-foot">
              <a className="link" href="#sources">
                View all sources
              </a>
            </div>
          </aside>
          ) : (
            <aside className="card lead-panel">
              <p className="lead-panel-text">No leads to display.</p>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
