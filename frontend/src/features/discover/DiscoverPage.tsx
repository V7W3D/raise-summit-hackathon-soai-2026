import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  MoreVertical,
  Building2,
  MapPin,
  Factory,
  Check,
  ArrowUpDown,
  Eye,
  Send,
  AlertCircle,
  Lightbulb,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle2,
  LayoutList,
  Map,
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
import { useMissions } from '../missions/use-missions-api-queries';
import type { LeadVM } from '../leads/use-leads-api-queries';
import {
  countByCategory,
  filterLeadsByCategory,
  tabLabel,
  type DiscoverViewMode,
  type FitCategory,
} from './discover-utils';
import { DiscoverMapView } from './graph/DiscoverMapView';
import { OutreachDraftPanel } from '../outreach/OutreachDraftPanel';
import './discover.css';
import './graph/discover-graph.css';

const FIT_CATEGORIES: FitCategory[] = [
  'high_fit',
  'promising',
  'needs_verification',
  'rejected',
];

const ALL_MISSIONS = -1;

const scorePill: Record<LeadVM['scoreTone'], string> = {
  green: 'pill-green',
  blue: 'pill-blue',
  orange: 'pill-orange',
};

function leadCity(lead: LeadVM): string {
  return lead.location.split(',')[0]?.trim() ?? '';
}

export function DiscoverPage() {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<FitCategory>('high_fit');
  const [viewMode, setViewMode] = useState<DiscoverViewMode>('list');
  const [missionChoice, setMissionChoice] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [requireContact, setRequireContact] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireWebsite, setRequireWebsite] = useState(false);
  const [sortDesc, setSortDesc] = useState(true);

  const { data: missions } = useMissions();
  const missionFromUrl = searchParams.get('mission');

  useEffect(() => {
    if (activeCategory === 'rejected' && viewMode === 'map') {
      setViewMode('list');
    }
  }, [activeCategory, viewMode]);

  const mapViewAvailable = activeCategory !== 'rejected';

  useEffect(() => {
    if (!missionFromUrl) return;
    const parsed = Number(missionFromUrl);
    if (!Number.isNaN(parsed)) {
      setMissionChoice(parsed);
    }
  }, [missionFromUrl]);

  const selectedMissionId = missionChoice ?? missions?.[0]?.id ?? ALL_MISSIONS;
  const activeMission = missions?.find((mission) => mission.id === selectedMissionId);

  const { data, isPending, isError } = useLeads({
    missionId: selectedMissionId === ALL_MISSIONS ? undefined : selectedMissionId,
  });
  const discoverLeads = useMemo(() => data ?? [], [data]);

  const locations = useMemo(() => {
    const cities = discoverLeads.map(leadCity).filter(Boolean);
    return [...new Set(cities)].slice(0, 6);
  }, [discoverLeads]);

  const industries = useMemo(() => {
    const items = discoverLeads.map((lead) => lead.industry).filter(Boolean);
    return [...new Set(items)].slice(0, 8);
  }, [discoverLeads]);

  const resetFilters = () => {
    setLocationFilter(null);
    setIndustryFilter(null);
    setRequireContact(false);
    setRequireEmail(false);
    setRequirePhone(false);
    setRequireWebsite(false);
  };

  /* Sidebar filters apply before the category tabs so tab counts stay honest. */
  const baseLeads = useMemo(
    () =>
      discoverLeads.filter((lead) => {
        if (locationFilter && leadCity(lead) !== locationFilter) return false;
        if (industryFilter && lead.industry !== industryFilter) return false;
        if (requireContact && !lead.email && !lead.phone) return false;
        if (requireEmail && !lead.email) return false;
        if (requirePhone && !lead.phone) return false;
        if (requireWebsite && !lead.website) return false;
        return true;
      }),
    [
      discoverLeads,
      locationFilter,
      industryFilter,
      requireContact,
      requireEmail,
      requirePhone,
      requireWebsite,
    ],
  );

  const categoryCounts = useMemo(() => countByCategory(baseLeads), [baseLeads]);
  const filteredLeads = useMemo(
    () =>
      filterLeadsByCategory(baseLeads, activeCategory).sort((a, b) =>
        sortDesc ? b.score - a.score : a.score - b.score,
      ),
    [baseLeads, activeCategory, sortDesc],
  );

  const hasActiveFilters =
    locationFilter !== null ||
    industryFilter !== null ||
    requireContact ||
    requireEmail ||
    requirePhone ||
    requireWebsite;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [outreachLeadId, setOutreachLeadId] = useState<number | null>(null);
  const effectiveSelectedId = selectedId ?? filteredLeads[0]?.id ?? discoverLeads[0]?.id;
  const selected =
    discoverLeads.find((lead) => lead.id === effectiveSelectedId) ??
    filteredLeads[0] ??
    discoverLeads[0];
  const outreachLead = discoverLeads.find((lead) => lead.id === outreachLeadId);
  const outreachMissionName = outreachLead
    ? missions?.find((mission) => mission.id === outreachLead.missionId)?.name
    : undefined;

  if (isPending) {
    return <p className="page-subtitle">Loading…</p>;
  }

  if (isError) {
    return <p className="page-subtitle">Unable to load leads.</p>;
  }

  return (
    <div>
      <div className="discover-header">
        <h1 className="page-title">Discover Leads</h1>
      </div>

      <div className="card mission-bar">
        <span className="icon-tile blue">
          <Building2 />
        </span>
        <div className="mission-bar-info">
          <span className="mission-bar-name">
            {activeMission ? activeMission.name : 'All missions'}
            {activeMission && <span className="mission-bar-dot" />}
          </span>
          {activeMission && (
            <span className="mission-bar-meta">
              {[activeMission.location, activeMission.target || activeMission.targetIndustry]
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}
        </div>
        <div className="mission-bar-stats">
          <span>
            <strong>{discoverLeads.length}</strong> leads
          </span>
          <span>
            <strong>{countByCategory(discoverLeads).high_fit}</strong> high fit
          </span>
        </div>
      </div>

      <div className={`discover-layout${selected ? '' : ' no-panel'}`}>
        <aside className="card filters-panel">
          <div className="filters-head">
            <span className="filters-head-title">Filters</span>
            {hasActiveFilters && (
              <button type="button" className="link filters-reset" onClick={resetFilters}>
                Reset all
              </button>
            )}
          </div>

          <div className="filter-group">
            <div className="filter-label">Mission</div>
            <select
              className="select-control"
              style={{ width: '100%' }}
              value={selectedMissionId}
              onChange={(event) => {
                setMissionChoice(Number(event.target.value));
                setSelectedId(null);
                resetFilters();
              }}
            >
              <option value={ALL_MISSIONS}>All missions</option>
              {(missions ?? []).map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.name}
                </option>
              ))}
            </select>
          </div>

          {locations.length > 0 && (
            <div className="filter-group">
              <div className="filter-label">Location</div>
              <div className="tag-row">
                {locations.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className={`filter-tag${locationFilter === city ? ' selected' : ''}`}
                    onClick={() =>
                      setLocationFilter((current) => (current === city ? null : city))
                    }
                  >
                    <MapPin size={11} /> {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {industries.length > 0 && (
            <div className="filter-group">
              <div className="filter-label">Industry</div>
              <div className="tag-row">
                {industries.map((industry) => (
                  <button
                    key={industry}
                    type="button"
                    className={`filter-tag${industryFilter === industry ? ' selected' : ''}`}
                    onClick={() =>
                      setIndustryFilter((current) => (current === industry ? null : industry))
                    }
                  >
                    <Factory size={11} /> {industry}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filter-group" style={{ marginBottom: 0 }}>
            <div className="filter-label">Requirements</div>
            <button
              type="button"
              className="toggle-row"
              onClick={() => setRequireContact((value) => !value)}
            >
              Has contact info
              <span className={`switch${requireContact ? ' on' : ''}`} />
            </button>
            <button
              type="button"
              className="toggle-row"
              onClick={() => setRequireEmail((value) => !value)}
            >
              Has email
              <span className={`switch${requireEmail ? ' on' : ''}`} />
            </button>
            <button
              type="button"
              className="toggle-row"
              onClick={() => setRequirePhone((value) => !value)}
            >
              Has phone
              <span className={`switch${requirePhone ? ' on' : ''}`} />
            </button>
            <button
              type="button"
              className="toggle-row"
              onClick={() => setRequireWebsite((value) => !value)}
            >
              Has website
              <span className={`switch${requireWebsite ? ' on' : ''}`} />
            </button>
          </div>
        </aside>

        <div className="leads-column">
          <div className="leads-tabs">
            <div className="leads-tab-group">
              {FIT_CATEGORIES.map((category) => {
                const label = tabLabel(category, categoryCounts[category]);
                return (
                  <button
                    key={category}
                    className={`leads-tab${category === activeCategory ? ' active' : ''}`}
                    onClick={() => {
                      setActiveCategory(category);
                      setSelectedId(null);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="leads-view-toggle">
              <button
                type="button"
                className={`leads-view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
              >
                <LayoutList /> List
              </button>
              <button
                type="button"
                className={`leads-view-toggle-btn${viewMode === 'map' ? ' active' : ''}`}
                onClick={() => setViewMode('map')}
                aria-pressed={viewMode === 'map'}
                disabled={!mapViewAvailable}
                title={mapViewAvailable ? undefined : 'Map view is best for actionable leads, not rejected noise'}
              >
                <Map /> Map
              </button>
            </div>
            <button
              className="select-control sort-btn"
              style={{ padding: '7px 12px', fontSize: '0.7813rem' }}
              onClick={() => setSortDesc((value) => !value)}
            >
              <ArrowUpDown /> Score {sortDesc ? 'high → low' : 'low → high'}
            </button>
          </div>
          <div className="leads-count">
            {filteredLeads.length} result{filteredLeads.length === 1 ? '' : 's'}
            {viewMode === 'map' ? ' · opportunity map' : ''}
          </div>

          {filteredLeads.length === 0 && viewMode === 'list' && (
            <p className="page-subtitle" style={{ padding: '24px 4px', textAlign: 'center' }}>
              No leads match the current filters.
            </p>
          )}

          {viewMode === 'map' ? (
            <DiscoverMapView
              leads={filteredLeads}
              selectedId={effectiveSelectedId ?? null}
              onSelectLead={setSelectedId}
              onDraftOutreach={setOutreachLeadId}
            />
          ) : (
            filteredLeads.map((lead) => {
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
                    <Link to={`/leads/${lead.id}`} className="btn btn-outline btn-sm">
                      <Eye size={14} /> Open details
                    </Link>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOutreachLeadId(lead.id);
                      }}
                    >
                      <Send size={14} /> Draft outreach
                    </button>
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>

        {selected && (
        <div className="lead-panel-wrap">
          <aside className="card lead-panel">
            <div className="lead-panel-head">
              <span className="pill pill-blue">Selected lead</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pill pill-purple">
                  AI-verified <Sparkles size={11} />
                </span>
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
                <Mail /> {selected.email}
              </div>
            )}
            {selected.phone && (
              <div className="contact-row">
                <Phone /> {selected.phone}
              </div>
            )}
            {!selected.email && !selected.phone && (
              <p className="lead-panel-text">No contact details found yet.</p>
            )}

            <div className="lead-panel-section-title" style={{ marginTop: 16 }}>Social presence</div>
            <div className="social-row">
              <span className="social-chip">
                <BrandDot bg="var(--blue)" label="in" /> LinkedIn
              </span>
              <span className="social-chip">
                <BrandDot bg="var(--muted)" label="f" /> Facebook
              </span>
              <span className="social-chip">
                <BrandDot bg="var(--faint)" label="ig" /> Instagram
              </span>
            </div>

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
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
                onClick={() => setOutreachLeadId(selected.id)}
              >
                <Send size={14} /> Draft outreach
              </button>
            </div>
          </aside>
        </div>
        )}
      </div>

      {outreachLead && (
        <OutreachDraftPanel
          lead={outreachLead}
          missionName={outreachMissionName}
          onClose={() => setOutreachLeadId(null)}
        />
      )}
    </div>
  );
}
