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
                "px-2 py-0.5 rounded-[4px] text-[12px] font-medium border transition-colors duration-150",
                active
                  ? "bg-white/[0.08] text-white border-white/[0.08]"
                  : "bg-transparent text-zinc-500 border-white/[0.04] hover:border-white/[0.08]"
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
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[12px] font-medium bg-white/[0.08] text-white border border-white/[0.08]"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggle(tag)}
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
          placeholder="Add custom tag..."
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
