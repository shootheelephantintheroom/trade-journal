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
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border " +
                (active
                  ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600")
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-500/20 border border-yellow-500 text-yellow-400"
            >
              {reason}
              <button
                type="button"
                onClick={() => toggle(reason)}
                className="text-yellow-400/60 hover:text-yellow-400"
              >
                &times;
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
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
