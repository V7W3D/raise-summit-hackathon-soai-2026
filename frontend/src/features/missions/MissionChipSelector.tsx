type ChipSelectorProps = {
  label: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  single?: boolean;
};

export function ChipSelector({
  label,
  hint,
  options,
  selected,
  onChange,
  single = false,
}: ChipSelectorProps) {
  const toggle = (option: string) => {
    if (single) {
      onChange(selected.includes(option) ? [] : [option]);
      return;
    }
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );
  };

  return (
    <div className="mission-chip-group">
      <div className="mission-chip-group-head">
        <span className="mission-field-label">{label}</span>
        {hint ? <span className="mission-chip-hint">{hint}</span> : null}
      </div>
      <div className="mission-chip-row">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              className={`mission-chip${isSelected ? ' selected' : ''}`}
              aria-pressed={isSelected}
              onClick={() => toggle(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type OptionCardProps = {
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
};

export function OptionCard({ label, description, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      className={`mission-option-card${selected ? ' selected' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="mission-option-card-label">{label}</span>
      <span className="mission-option-card-desc">{description}</span>
    </button>
  );
}
