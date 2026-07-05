import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  MapPin,
  ArrowUpDown,
  Send,
  ExternalLink,
  LayoutList,
  Map,
} from 'lucide-react';

import { ScoreRing, fitColor } from '@components/ScoreRing';
import { useLeads } from './use-discover-api-queries';
import { useMissions } from '../missions/use-missions-api-queries';
import type { LeadVM } from '../leads/use-leads-api-queries';
import { NetworkMemberBadge } from '../leads/NetworkMemberBadge';
import '../leads/network-member-badge.css';
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

export function DiscoverPage() {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<FitCategory>('high_fit');
  const [viewMode, setViewMode] = useState<DiscoverViewMode>('list');
  const [missionChoice, setMissionChoice] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState('');
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

  const resetFilters = () => {
    setLocationFilter('');
    setRequireContact(false);
    setRequireEmail(false);
    setRequirePhone(false);
    setRequireWebsite(false);
  };

  /* Sidebar filters apply before the category tabs so tab counts stay honest. */
  const baseLeads = useMemo(() => {
    const locationQuery = locationFilter.trim().toLowerCase();
    return discoverLeads.filter((lead) => {
      if (locationQuery && !lead.location.toLowerCase().includes(locationQuery)) return false;
      if (requireContact && !lead.email && !lead.phone) return false;
      if (requireEmail && !lead.email) return false;
      if (requirePhone && !lead.phone) return false;
      if (requireWebsite && !lead.website) return false;
      return true;
    });
  }, [
    discoverLeads,
    locationFilter,
    requireContact,
    requireEmail,
    requirePhone,
    requireWebsite,
  ]);

  const categoryCounts = useMemo(() => countByCategory(baseLeads), [baseLeads]);
  const filteredLeads = useMemo(
    () =>
      filterLeadsByCategory(baseLeads, activeCategory).sort((a, b) =>
        sortDesc ? b.score - a.score : a.score - b.score,
      ),
    [baseLeads, activeCategory, sortDesc],
  );

  const hasActiveFilters =
    locationFilter.trim() !== '' ||
    requireContact ||
    requireEmail ||
    requirePhone ||
    requireWebsite;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [outreachLeadId, setOutreachLeadId] = useState<number | null>(null);
  const effectiveSelectedId = selectedId ?? filteredLeads[0]?.id ?? discoverLeads[0]?.id;
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

      {activeMission ? (
        <Link className="card mission-bar mission-bar-link" to={`/missions/${activeMission.id}`}>
          <span className="icon-tile blue">
            <Building2 />
          </span>
          <div className="mission-bar-info">
            <span className="mission-bar-name">
              {activeMission.name}
              <span className="mission-bar-dot" />
            </span>
            <span className="mission-bar-meta">
              {[activeMission.location, activeMission.target || activeMission.targetIndustry]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
          <div className="mission-bar-stats">
            <span>
              <strong>{discoverLeads.length}</strong> leads
            </span>
            <span>
              <strong>{countByCategory(discoverLeads).high_fit}</strong> high fit
            </span>
          </div>
        </Link>
      ) : (
        <div className="card mission-bar">
          <span className="icon-tile blue">
            <Building2 />
          </span>
          <div className="mission-bar-info">
            <span className="mission-bar-name">All missions</span>
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
      )}

      <div className="discover-layout no-panel">
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
              {(missions ?? []).map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <div className="filter-label">Location</div>
            <div className="filter-search">
              <MapPin size={13} />
              <input
                type="text"
                className="filter-search-input"
                placeholder="Filter by location"
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
              />
            </div>
          </div>

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
            filteredLeads.map((lead) => (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className={`card lead-card${lead.isNetworkMember ? ` network-member${lead.networkBadge === 'sponsored' ? ' sponsored' : ''}` : ''}`}
              >
                <div className="lead-card-main">
                  <span className="lead-logo" style={{ background: lead.logoColor }}>
                    {lead.initials}
                  </span>
                  <div className="lead-identity-body">
                    <div className="lead-name-row">
                      <div className="lead-name">{lead.name}</div>
                      <NetworkMemberBadge lead={lead} />
                    </div>
                    <div className="lead-desc">{lead.description}</div>
                    <div className="lead-meta-row">
                      <span className="lead-loc">
                        <MapPin /> {lead.location}
                      </span>
                      <span className="lead-loc">
                        <ExternalLink /> {lead.website}
                      </span>
                      <span className="lead-contact-badge">{lead.contactBadge}</span>
                    </div>
                  </div>

                  <div className="lead-score">
                    <ScoreRing value={lead.score} size={62} stroke={5} color={fitColor(lead.score)} fontSize={17} />
                    <span className={`pill ${scorePill[lead.scoreTone]}`}>{lead.scoreLabel}</span>
                  </div>

                  <div className="lead-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setOutreachLeadId(lead.id);
                      }}
                    >
                      <Send size={14} /> Draft outreach
                    </button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
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
