import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Eye, MoreVertical, Trash2 } from 'lucide-react';

type MissionOptionsMenuProps = {
  missionId: number;
  missionName: string;
  onDelete: () => void;
  onArchive?: () => void;
  isDeleting: boolean;
  isArchiving: boolean;
};

export function MissionOptionsMenu({
  missionId,
  missionName,
  onDelete,
  onArchive,
  isDeleting,
  isArchiving,
}: MissionOptionsMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const handleView = () => {
    navigate(`/missions/${missionId}`);
    setOpen(false);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete "${missionName}"? All leads linked to this mission will also be removed.`,
    );
    if (!confirmed) return;

    onDelete();
    setOpen(false);
  };

  const handleArchive = () => {
    const confirmed = window.confirm(
      `Archive "${missionName}"? It will be hidden from active missions.`,
    );
    if (!confirmed) return;

    onArchive?.();
    setOpen(false);
  };

  return (
    <div className="mission-menu" ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Mission options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical size={17} />
      </button>

      {open ? (
        <div className="mission-menu-panel" role="menu">
          <button type="button" role="menuitem" className="mission-menu-item" onClick={handleView}>
            <Eye size={15} />
            View mission
          </button>
          {onArchive ? (
            <button
              type="button"
              role="menuitem"
              className="mission-menu-item"
              onClick={handleArchive}
              disabled={isArchiving}
            >
              <Archive size={15} />
              {isArchiving ? 'Archiving…' : 'Archive mission'}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="mission-menu-item mission-menu-item-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={15} />
            {isDeleting ? 'Deleting…' : 'Delete mission'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
