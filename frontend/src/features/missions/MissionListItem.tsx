import { MapPin } from 'lucide-react';
import { ScoreRing } from '@components/ScoreRing';
import { MissionOptionsMenu } from './MissionOptionsMenu';
import type { MissionVM } from './use-missions-api-queries';

type MissionListItemProps = {
  mission: MissionVM;
  onDelete: () => void;
  onArchive?: () => void;
  isDeleting: boolean;
  isArchiving: boolean;
  archived?: boolean;
};

export function MissionListItem({
  mission,
  onDelete,
  onArchive,
  isDeleting,
  isArchiving,
  archived = false,
}: MissionListItemProps) {
  return (
    <div className="card mission-card">
      <div className="mission-main">
        <div className="mission-name">{mission.name}</div>
        {mission.target ? <div className="mission-target">{mission.target}</div> : null}
        {mission.location ? (
          <div className="mission-tags">
            <span className="mission-tag">
              <MapPin /> {mission.location}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mission-actions">
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
      </div>
    </div>
  );
}
