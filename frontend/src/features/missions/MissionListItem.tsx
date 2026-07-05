import type { KeyboardEvent } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MissionVM } from './use-missions-api-queries';

type MissionListItemProps = {
  mission: MissionVM;
  archived?: boolean;
};

export function MissionListItem({ mission, archived = false }: MissionListItemProps) {
  const navigate = useNavigate();
  const isSearching = mission.searchStatus === 'running';

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
          <div className="mission-search-status">Agent is searching for leads…</div>
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

      {!archived && isSearching ? (
        <div className="mission-actions">
          <span className="mission-search-badge">Searching</span>
        </div>
      ) : null}
    </div>
  );
}
