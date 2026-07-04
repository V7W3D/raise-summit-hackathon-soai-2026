import { Loader2, MapPin, Sparkles } from 'lucide-react';
import { ScoreRing } from '@components/ScoreRing';
import { MissionOptionsMenu } from './MissionOptionsMenu';
import type { MissionVM } from './use-missions-api-queries';

type MissionListItemProps = {
  mission: MissionVM;
  onDelete: () => void;
  onArchive?: () => void;
  onRunSearch?: () => void;
  isDeleting: boolean;
  isArchiving: boolean;
  isRunningSearch: boolean;
  archived?: boolean;
};

export function MissionListItem({
  mission,
  onDelete,
  onArchive,
  onRunSearch,
  isDeleting,
  isArchiving,
  isRunningSearch,
  archived = false,
}: MissionListItemProps) {
  const isSearching = mission.searchStatus === 'running';
  const canRunSearch = !archived && !isSearching && onRunSearch;
  const runSearchLabel =
    mission.searchStatus === 'failed' ? 'Retry agent' : 'Run agent';

  return (
    <div className={`card mission-card${isSearching ? ' mission-card-searching' : ''}`}>
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
          <>
            {canRunSearch ? (
              <button
                type="button"
                className="btn btn-outline mission-run-search-btn"
                onClick={onRunSearch}
                disabled={isRunningSearch}
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
            ) : null}
            <ScoreRing
              value={mission.progress}
              size={54}
              stroke={5}
              color="var(--accent)"
              fontSize={13}
              label={`${mission.progress}%`}
            />
            <MissionOptionsMenu
              missionId={mission.id}
              missionName={mission.name}
              onDelete={onDelete}
              onArchive={archived ? undefined : onArchive}
              isDeleting={isDeleting}
              isArchiving={isArchiving}
            />
          </>
        )}
      </div>
    </div>
  );
}
