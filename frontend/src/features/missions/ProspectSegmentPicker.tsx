import { Loader2, Sparkles } from 'lucide-react';
import type { ProspectSegmentVM } from './use-missions-api-queries';

type ProspectSegmentPickerProps = {
  segments: ProspectSegmentVM[];
  selectedId: string;
  onSelect: (segment: ProspectSegmentVM) => void;
  isLoading?: boolean;
};

export function ProspectSegmentPicker({
  segments,
  selectedId,
  onSelect,
  isLoading = false,
}: ProspectSegmentPickerProps) {
  if (isLoading) {
    return (
      <div className="prospect-segment-loading">
        <Loader2 size={18} className="spin" />
        <span>Building segments from your profile…</span>
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <p className="prospect-segment-empty">
        Complete your business profile to get tailored prospect suggestions.
      </p>
    );
  }

  return (
    <div className="prospect-segment-list">
      {segments.map((segment) => {
        const selected = selectedId === segment.id;
        return (
          <button
            key={segment.id}
            type="button"
            className={`prospect-segment-card${selected ? ' selected' : ''}`}
            aria-pressed={selected}
            onClick={() => onSelect(segment)}
          >
            <span className="prospect-segment-card-head">
              {selected ? <Sparkles size={14} /> : null}
              <span className="prospect-segment-label">{segment.label}</span>
            </span>
            <span className="prospect-segment-reason">{segment.reason}</span>
            {segment.triggerSignals.length > 0 ? (
              <span className="prospect-segment-signals">
                {segment.triggerSignals.slice(0, 3).join(' · ')}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
