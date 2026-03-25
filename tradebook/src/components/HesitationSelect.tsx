import { useState } from "react";
import { cn } from "../lib/utils";

const PRESET_REASONS = [
  "No conviction",
  "Already in a trade",
  "Missed the alert",
  "Size fear",
  "Chasing",
  "Waited too long",
  "Wasn't in plan",
];

export default function HesitationSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (reasons: string[]) => void;
}) {
  const [custom, setCustom] = useState("");

  function toggle(reason: string) {
    if (selected.includes(reason)) {
      onChange(selected.filter((r) => r !== reason));
    } else {
      onChange([...selected, reason]);
    }
  }

  function addCustom() {
    const trimmed = custom.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustom("");
    }
  }

  const customReasons = selected.filter((r) => !PRESET_REASONS.includes(r));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESET_REASONS.map((reason) => {
          const active = selected.includes(reason);
          return (
            <button
              key={reason}
              type="button"
              onClick={() => toggle(reason)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                active
                  ? "bg-amber-muted border-amber/30 text-amber"
                  : "bg-surface-2 border-transparent text-tertiary hover:border-border-hover hover:text-secondary"
              )}
            >
              {reason}
            </button>
          );
        })}
      </div>

      {customReasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customReasons.map((reason) => (
            <span
              key={reason}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-muted border border-amber/30 text-amber"
            >
              {reason}
              <button
                type="button"
                onClick={() => toggle(reason)}
                className="text-amber/50 hover:text-amber text-sm leading-none"
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
          placeholder="Add custom reason..."
          className="flex-1 rounded-lg border border-transparent bg-surface-2 px-3 py-1.5 text-xs text-primary placeholder-tertiary hover:border-border-hover focus:border-amber focus:outline-none transition-colors"
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
