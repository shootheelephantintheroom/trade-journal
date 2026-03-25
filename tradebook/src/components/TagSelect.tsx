import { useState } from "react";
import { cn } from "../lib/utils";

const PRESET_TAGS = [
  "VWAP Reclaim",
  "Halt Resume",
  "First Red Day",
  "Break of Structure",
  "Panic Sell",
  "Breakout",
  "Fade",
  "Reversal",
];

export default function TagSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const [custom, setCustom] = useState("");

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  function addCustom() {
    const trimmed = custom.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustom("");
    }
  }

  const customTags = selected.filter((t) => !PRESET_TAGS.includes(t));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESET_TAGS.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                active
                  ? "bg-brand-muted border-brand/30 text-brand"
                  : "bg-surface-2 border-transparent text-tertiary hover:border-border-hover hover:text-secondary"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-brand-muted border border-brand/30 text-brand"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggle(tag)}
                className="text-brand/50 hover:text-brand text-sm leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add custom tag..."
          className="flex-1 rounded-lg border border-transparent bg-surface-2 px-3 py-1.5 text-xs text-primary placeholder-tertiary hover:border-border-hover focus:border-brand focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 border border-transparent text-tertiary hover:text-primary hover:border-border-hover transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
