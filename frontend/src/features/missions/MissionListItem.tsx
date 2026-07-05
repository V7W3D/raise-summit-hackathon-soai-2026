import type { KeyboardEvent } from 'react';
import { Loader2, MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MissionVM } from './use-missions-api-queries';

type MissionListItemProps = {
  mission: MissionVM;
  onRunSearch?: () => void;
  isRunningSearch: boolean;
  archived?: boolean;
};

export function MissionListItem({
  mission,
  onRunSearch,
  isRunningSearch,
  archived = false,
}: MissionListItemProps) {
  const navigate = useNavigate();
  const isSearching = mission.searchStatus === 'running';
  const canRunSearch = !archived && !isSearching && onRunSearch;
  const isRunSearchEnabled = mission.searchActivated && !isRunningSearch;
  const runSearchLabel =
    mission.searchStatus === 'failed' ? 'Retry agent' : 'Run agent';
  const runSearchTitle = mission.searchActivated
    ? undefined
    : 'Update the mission to run the agent again';

  const handleCardClick = () => {
    navigate(`/missions/${mission.id}`);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      className={`card mission-card mission-card-clickable${isSearching ? ' mission-card-searching' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`View mission: ${mission.name}`}
    >
      <div className="mission-main">
        <div className="mission-name">{mission.name}</div>
        {isSearching ? (
          <div className="mission-search-status">
            <Loader2 className="mission-search-spinner" size={14} aria-hidden />
            Agent is currently fetching leads…
          </div>
        ) : null}
        {!isSearching && mission.target ? (
          <div className="mission-target">{mission.target}</div>
        ) : null}
        {!isSearching && mission.location ? (
          <div className="mission-tags">
            <span className="mission-tag">
              <MapPin /> {mission.location}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mission-actions">
        {isSearching ? (
          <span className="mission-search-badge">Fetching</span>
        ) : (
          canRunSearch ? (
            <button
              type="button"
              className="btn btn-outline mission-run-search-btn"
              onClick={(event) => {
                event.stopPropagation();
                onRunSearch?.();
              }}
              disabled={!isRunSearchEnabled}
              title={runSearchTitle}
            >
              {isRunningSearch ? (
                <>
                  <Loader2 className="mission-search-spinner" size={15} aria-hidden />
                  Starting…
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  {runSearchLabel}
                </>
              )}
            </button>
          ) : null
        )}
      </div>
    </div>
  );
}
