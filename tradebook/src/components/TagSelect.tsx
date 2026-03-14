import { useState } from "react";

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
              className={
                "pill-tag px-3 py-1.5 rounded-full text-xs font-medium transition-all border " +
                (active
                  ? "bg-accent-500/20 border-accent-500 text-accent-400 shadow-[0_0_8px_rgba(0,200,83,0.15)]"
                  : "bg-gray-800/80 border-gray-700/80 text-gray-400 hover:border-gray-500 hover:text-gray-300")
              }
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-accent-500/20 border border-accent-500 text-accent-400"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggle(tag)}
                className="text-accent-400/50 hover:text-accent-400 text-sm leading-none"
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
          className="flex-1 rounded-lg border border-gray-700/80 bg-gray-800/80 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/80 border border-gray-700/80 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
