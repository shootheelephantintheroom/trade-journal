import { useState } from "react";

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
              className={
                "pill-tag px-3 py-1.5 rounded-full text-xs font-medium transition-all border " +
                (active
                  ? "bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.15)]"
                  : "bg-gray-800/80 border-gray-700/80 text-gray-400 hover:border-gray-500 hover:text-gray-300")
              }
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-500/20 border border-yellow-500 text-yellow-400"
            >
              {reason}
              <button
                type="button"
                onClick={() => toggle(reason)}
                className="text-yellow-400/50 hover:text-yellow-400 text-sm leading-none"
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
          className="flex-1 rounded-lg border border-gray-700/80 bg-gray-800/80 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
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
