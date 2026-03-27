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
                "px-2 py-0.5 rounded-[4px] text-[12px] font-medium border transition-colors duration-150",
                active
                  ? "bg-white/[0.08] text-white border-white/[0.08]"
                  : "bg-transparent text-zinc-500 border-white/[0.04] hover:border-white/[0.08]"
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
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[12px] font-medium bg-white/[0.08] text-white border border-white/[0.08]"
            >
              {reason}
              <button
                type="button"
                onClick={() => toggle(reason)}
                className="text-brand/50 hover:text-brand text-sm leading-none transition-colors duration-150"
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
          className="flex-1 h-[34px] rounded-[6px] border border-white/[0.06] bg-transparent px-[10px] py-[7px] text-[13px] text-primary placeholder-tertiary hover:border-white/[0.1] focus:border-white/[0.15] focus:outline-none transition-colors duration-150"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-transparent border border-white/[0.06] text-zinc-500 hover:text-primary hover:border-white/[0.1] transition-colors duration-150"
        >
          Add
        </button>
      </div>
    </div>
  );
}
