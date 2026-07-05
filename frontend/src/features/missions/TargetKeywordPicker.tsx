import { type FormEvent } from 'react';
import { Loader2, Plus, Sparkles, X } from 'lucide-react';

type TargetKeywordPickerProps = {
  keywords: string[];
  selected: string;
  onSelect: (keyword: string) => void;
  onAdd: (keyword: string) => void;
  onRemove: (keyword: string) => void;
  isLoading?: boolean;
};

export function normalizeKeyword(value: string): string {
  const word = value.trim().split(/\s+/)[0] ?? '';
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function TargetKeywordPicker({
  keywords,
  selected,
  onSelect,
  onAdd,
  onRemove,
  isLoading = false,
}: TargetKeywordPickerProps) {
  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = String(formData.get('keyword') ?? '');
    const keyword = normalizeKeyword(raw);
    if (!keyword) return;
    onAdd(keyword);
    event.currentTarget.reset();
  };

  return (
    <div className="target-keyword-panel">
      <div className="target-keyword-head">
        <div>
          <span className="target-keyword-title">Your targets</span>
          {isLoading ? (
            <span className="target-keyword-hint">Generating keywords…</span>
          ) : null}
        </div>

        <form className="target-keyword-add-form" onSubmit={handleAdd}>
          <input
            className="target-keyword-add-input"
            name="keyword"
            placeholder="Add word…"
            maxLength={40}
            disabled={isLoading}
          />
          <button type="submit" className="target-keyword-add-btn" disabled={isLoading}>
            <Plus size={15} />
          </button>
        </form>
      </div>

      <div className="target-keyword-list" aria-busy={isLoading}>
        {isLoading ? (
          <div className="target-keyword-loading">
            <Loader2 size={18} className="spin" />
            <span>Building your target list…</span>
          </div>
        ) : keywords.length === 0 ? (
          <p className="target-keyword-empty">Add at least one target keyword to continue.</p>
        ) : (
          keywords.map((keyword) => {
            const isSelected = selected.toLowerCase() === keyword.toLowerCase();
            return (
              <div
                key={keyword}
                className={`target-keyword-chip${isSelected ? ' selected' : ''}`}
              >
                <button
                  type="button"
                  className="target-keyword-chip-label"
                  onClick={() => onSelect(keyword)}
                  aria-pressed={isSelected}
                >
                  {isSelected ? <Sparkles size={12} /> : null}
                  {keyword}
                </button>
                <button
                  type="button"
                  className="target-keyword-chip-remove"
                  aria-label={`Remove ${keyword}`}
                  onClick={() => onRemove(keyword)}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
