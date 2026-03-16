import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { Trade, TradeInsert, CatalystType } from "../types/trade";
import { calcPnl, calcNetPnl, calcRR, calcMaxRisk } from "../lib/calc";
import TagSelect from "./TagSelect";
import { useToast } from "./Toast";
import { todayLocal } from "../lib/date";
import { useSubscription } from "../contexts/SubscriptionContext";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CATALYST_OPTIONS: { value: CatalystType; label: string }[] = [
  { value: "earnings", label: "Earnings" },
  { value: "news_pr", label: "News/PR" },
  { value: "fda", label: "FDA" },
  { value: "sec_filing", label: "SEC Filing" },
  { value: "short_squeeze", label: "Short Squeeze" },
  { value: "sympathy", label: "Sympathy Play" },
  { value: "technical", label: "Technical" },
  { value: "other", label: "Other" },
];

function formatLargeNumber(n: number | null): string {
  if (n == null || n === 0) return "";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

const empty: TradeInsert = {
  ticker: "",
  side: "long",
  entry_price: 0,
  exit_price: 0,
  shares: 0,
  trade_date: todayLocal(),
  entry_time: "",
  exit_time: "",
  setup: "",
  notes: "",
  emotions: "",
  stop_loss_price: null,
  tags: [],
  grade: "",
  premarket_plan: "",
  screenshot_url: null,
  catalyst: "",
  catalyst_type: null,
  float_shares: null,
  market_cap: null,
  rvol: null,
  commission: 0,
  is_scaled: false,
  avg_entry_price: null,
  avg_exit_price: null,
  total_shares: null,
};

const GRADES = [
  { value: "A", label: "A", desc: "Textbook", bg: "bg-accent-500/15", border: "border-accent-500", text: "text-accent-400", activeBg: "bg-accent-500/25" },
  { value: "B", label: "B", desc: "Good", bg: "bg-blue-500/15", border: "border-blue-500", text: "text-blue-400", activeBg: "bg-blue-500/25" },
  { value: "C", label: "C", desc: "Sloppy", bg: "bg-yellow-500/15", border: "border-yellow-500", text: "text-yellow-400", activeBg: "bg-yellow-500/25" },
  { value: "D", label: "D", desc: "Broke rules", bg: "bg-red-500/15", border: "border-red-500", text: "text-red-400", activeBg: "bg-red-500/25" },
] as const;

export default function TradeForm({
  onSaved,
  editTrade,
  onEditDone,
}: {
  onSaved?: () => void;
  editTrade?: Trade | null;
  onEditDone?: () => void;
}) {
  const { showToast } = useToast();
  const { isPro } = useSubscription();
  const [form, setForm] = useState<TradeInsert>({ ...empty });
  const [saving, setSaving] = useState(false);
  const [emotionInput, setEmotionInput] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [marketContextOpen, setMarketContextOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When editTrade changes, populate form
  useEffect(() => {
    if (editTrade) {
      const { id, created_at, ...rest } = editTrade;
      setForm(rest);
      setEmotionInput("");
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setRemoveExisting(false);
    } else {
      setForm({ ...empty, trade_date: todayLocal() });
      setEmotionInput("");
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setRemoveExisting(false);
    }
  }, [editTrade]);

  function set<K extends keyof TradeInsert>(key: K, value: TradeInsert[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const pnl =
    form.entry_price > 0 && form.exit_price > 0 && form.shares > 0
      ? calcPnl(form)
      : null;
  const netPnl =
    pnl !== null && form.commission > 0
      ? calcNetPnl(form)
      : null;
  const rr = form.stop_loss_price ? calcRR(form) : null;
  const maxRisk = form.stop_loss_price ? calcMaxRisk(form) : null;

  // Parse emotions string into pills
  const emotionPills = form.emotions
    ? form.emotions
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
    : [];

  function addEmotion() {
    const trimmed = emotionInput.trim();
    if (trimmed && !emotionPills.includes(trimmed)) {
      const updated = [...emotionPills, trimmed].join(", ");
      set("emotions", updated);
      setEmotionInput("");
    }
  }

  function removeEmotion(emotion: string) {
    const updated = emotionPills.filter((e) => e !== emotion).join(", ");
    set("emotions", updated);
  }

  function handleScreenshotSelect(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast("Only PNG, JPEG, and WebP images are allowed", "error");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast("Image must be under 5MB", "error");
      return;
    }
    setScreenshotFile(file);
    setRemoveExisting(false);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  }

  function clearScreenshot() {
    setScreenshotFile(null);
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (editTrade?.screenshot_url) setRemoveExisting(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // Upload screenshot if a new file is selected
    let screenshotUrl: string | null = form.screenshot_url;
    if (screenshotFile) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const ext = screenshotFile.name.split(".").pop() || "png";
        const ticker = form.ticker.toUpperCase().trim() || "UNKNOWN";
        const filePath = `${user.id}/${Date.now()}-${ticker}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("screenshots")
          .upload(filePath, screenshotFile);
        if (uploadErr) {
          showToast("Screenshot upload failed — saving trade without it", "error");
          screenshotUrl = editTrade?.screenshot_url ?? null;
        } else {
          const { data: urlData } = supabase.storage
            .from("screenshots")
            .getPublicUrl(filePath);
          screenshotUrl = urlData.publicUrl;
        }
      }
    } else if (removeExisting) {
      screenshotUrl = null;
    }

    const payload = {
      ...form,
      ticker: form.ticker.toUpperCase().trim(),
      stop_loss_price: form.stop_loss_price || null,
      grade: form.grade || null,
      screenshot_url: screenshotUrl,
    };

    const { error: err } = editTrade
      ? await supabase.from("trades").update(payload).eq("id", editTrade.id)
      : await supabase.from("trades").insert(payload);

    setSaving(false);
    if (err) {
      showToast(err.message, "error");
    } else {
      showToast(editTrade ? "Trade updated!" : "Trade saved!", "success");
      setForm({ ...empty, trade_date: todayLocal() });
      setEmotionInput("");
      setScreenshotFile(null);
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
      setRemoveExisting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (editTrade) onEditDone?.();
      onSaved?.();
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-700/80 bg-gray-800/80 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none transition-colors";
  const labelClass =
    "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-bold text-white font-display tracking-tight">
        {editTrade ? "Edit Trade" : "Log a Trade"}
      </h2>
      {editTrade && (
        <button
          type="button"
          onClick={() => onEditDone?.()}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Cancel edit
        </button>
      )}

      {/* Ticker & Side */}
      <div className="form-section">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Ticker</label>
            <input
              className={inputClass}
              placeholder="e.g. AAPL"
              value={form.ticker}
              onChange={(e) => set("ticker", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Side</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set("side", "long")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  form.side === "long"
                    ? "bg-accent-500/15 border border-accent-500 text-accent-400"
                    : "bg-gray-800/80 border border-gray-700/80 text-gray-400 hover:border-gray-600"
                }`}
              >
                Long
              </button>
              <button
                type="button"
                onClick={() => set("side", "short")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  form.side === "short"
                    ? "bg-red-500/15 border border-red-500 text-red-400"
                    : "bg-gray-800/80 border border-gray-700/80 text-gray-400 hover:border-gray-600"
                }`}
              >
                Short
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Entry / Exit / Shares */}
      <div className="form-section">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
          Position
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Entry</label>
            <input
              type="number"
              step="any"
              min="0"
              className={inputClass}
              value={form.entry_price || ""}
              onChange={(e) =>
                set("entry_price", parseFloat(e.target.value) || 0)
              }
              required
            />
          </div>
          <div>
            <label className={labelClass}>Exit</label>
            <input
              type="number"
              step="any"
              min="0"
              className={inputClass}
              value={form.exit_price || ""}
              onChange={(e) =>
                set("exit_price", parseFloat(e.target.value) || 0)
              }
              required
            />
          </div>
          <div>
            <label className={labelClass}>Shares</label>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={form.shares || ""}
              onChange={(e) => set("shares", parseInt(e.target.value) || 0)}
              required
            />
          </div>
        </div>

        {/* Stop Loss */}
        <div className="mt-3">
          <label className={labelClass}>Stop Loss</label>
          <input
            type="number"
            step="any"
            min="0"
            className={inputClass + " max-w-[200px]"}
            placeholder="Optional"
            value={form.stop_loss_price ?? ""}
            onChange={(e) =>
              set(
                "stop_loss_price",
                e.target.value ? parseFloat(e.target.value) : null
              )
            }
          />
        </div>
      </div>

      {/* P&L Preview */}
      {pnl !== null && (
        <div className="card-panel px-4 py-3 flex flex-wrap gap-x-6 gap-y-1.5">
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {netPnl !== null ? "Gross " : ""}P&L{" "}
            <span
              className={
                "text-sm font-bold ml-1 " +
                (pnl >= 0 ? "text-accent-400" : "text-red-400")
              }
            >
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </span>
          </span>
          {netPnl !== null && (
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Net P&L{" "}
              <span
                className={
                  "text-sm font-bold ml-1 " +
                  (netPnl >= 0 ? "text-accent-400" : "text-red-400")
                }
              >
                {netPnl >= 0 ? "+" : ""}${netPnl.toFixed(2)}
              </span>
            </span>
          )}
          {rr !== null && (
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              R:R{" "}
              <span
                className={
                  "text-sm font-bold ml-1 " +
                  (rr >= 0 ? "text-accent-400" : "text-red-400")
                }
              >
                {rr.toFixed(2)}
              </span>
            </span>
          )}
          {maxRisk !== null && (
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Risk{" "}
              <span className="text-sm font-bold text-yellow-400 ml-1">
                ${maxRisk.toFixed(2)}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Trade Grade — Buttons */}
      <div>
        <label className={labelClass}>Trade Grade</label>
        <div className="flex gap-2">
          {GRADES.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() =>
                set("grade", form.grade === g.value ? "" : g.value)
              }
              className={`grade-btn flex-1 py-2 rounded-lg text-center border font-bold text-sm ${
                form.grade === g.value
                  ? `${g.activeBg} ${g.border} ${g.text}`
                  : "bg-gray-800/80 border-gray-700/80 text-gray-500 hover:border-gray-600"
              }`}
            >
              <span className="text-base">{g.label}</span>
              <span className="block text-[10px] font-medium opacity-70 mt-0.5">
                {g.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Date / Times */}
      <div className="form-section">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
          Timing
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.trade_date}
              onChange={(e) => set("trade_date", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Entry Time</label>
            <input
              type="time"
              className={inputClass}
              value={form.entry_time}
              onChange={(e) => set("entry_time", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Exit Time</label>
            <input
              type="time"
              className={inputClass}
              value={form.exit_time}
              onChange={(e) => set("exit_time", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Market Context — Pro only, collapsible */}
      <div className="form-section">
        <button
          type="button"
          onClick={() => setMarketContextOpen((o) => !o)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
              Market Context
            </p>
            {!isPro && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-accent-500/15 text-accent-400 border border-accent-500/30 rounded px-1.5 py-0.5">
                Pro
              </span>
            )}
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 text-gray-600 transition-transform ${marketContextOpen ? "rotate-180" : ""}`}
          >
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>

        {marketContextOpen && (
          <div className={`mt-3 space-y-3 ${!isPro ? "opacity-50 pointer-events-none select-none" : ""}`}>
            {/* Catalyst */}
            <div>
              <label className={labelClass}>Catalyst</label>
              <input
                className={inputClass}
                placeholder="e.g. FDA approval, partnership announced"
                value={form.catalyst}
                onChange={(e) => set("catalyst", e.target.value)}
                disabled={!isPro}
              />
            </div>

            {/* Catalyst Type */}
            <div>
              <label className={labelClass}>Catalyst Type</label>
              <select
                className={inputClass}
                value={form.catalyst_type ?? ""}
                onChange={(e) =>
                  set("catalyst_type", (e.target.value || null) as CatalystType | null)
                }
                disabled={!isPro}
              >
                <option value="">Select type...</option>
                {CATALYST_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Float & Market Cap */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Float
                  {form.float_shares ? (
                    <span className="ml-1.5 text-accent-400 normal-case">{formatLargeNumber(form.float_shares)}</span>
                  ) : null}
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  placeholder="e.g. 15000000"
                  value={form.float_shares ?? ""}
                  onChange={(e) =>
                    set("float_shares", e.target.value ? parseFloat(e.target.value) : null)
                  }
                  disabled={!isPro}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Market Cap
                  {form.market_cap ? (
                    <span className="ml-1.5 text-accent-400 normal-case">{formatLargeNumber(form.market_cap)}</span>
                  ) : null}
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  placeholder="e.g. 50000000"
                  value={form.market_cap ?? ""}
                  onChange={(e) =>
                    set("market_cap", e.target.value ? parseFloat(e.target.value) : null)
                  }
                  disabled={!isPro}
                />
              </div>
            </div>

            {/* RVOL & Commission */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>RVOL</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className={inputClass}
                  placeholder="e.g. 3.5"
                  value={form.rvol ?? ""}
                  onChange={(e) =>
                    set("rvol", e.target.value ? parseFloat(e.target.value) : null)
                  }
                  disabled={!isPro}
                />
              </div>
              <div>
                <label className={labelClass}>Commission</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className={inputClass}
                  placeholder="$0.00"
                  value={form.commission || ""}
                  onChange={(e) =>
                    set("commission", parseFloat(e.target.value) || 0)
                  }
                  disabled={!isPro}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Playbook Tags */}
      <div>
        <label className={labelClass}>Playbook Tags</label>
        <TagSelect
          selected={form.tags}
          onChange={(tags) => set("tags", tags)}
        />
      </div>

      {/* Pre-market Plan */}
      <div>
        <label className={labelClass}>Pre-market Plan / Thesis</label>
        <textarea
          className={inputClass + " resize-none"}
          rows={2}
          placeholder="What's your thesis before entering?"
          value={form.premarket_plan}
          onChange={(e) => set("premarket_plan", e.target.value)}
        />
      </div>

      {/* Setup */}
      <div>
        <label className={labelClass}>Setup</label>
        <input
          className={inputClass}
          placeholder="e.g. breakout above VWAP with volume"
          value={form.setup}
          onChange={(e) => set("setup", e.target.value)}
        />
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          className={inputClass + " resize-none"}
          rows={3}
          placeholder="What happened during this trade?"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {/* Emotions — Pill selector */}
      <div>
        <label className={labelClass}>Emotions</label>
        {emotionPills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {emotionPills.map((emotion) => (
              <span key={emotion} className="emotion-pill">
                {emotion}
                <button
                  type="button"
                  onClick={() => removeEmotion(emotion)}
                  className="text-accent-400/50 hover:text-accent-400 ml-0.5 text-sm leading-none"
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
            value={emotionInput}
            onChange={(e) => setEmotionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEmotion();
              }
            }}
            placeholder="e.g. FOMO, confident, anxious"
            className="flex-1 rounded-lg border border-gray-700/80 bg-gray-800/80 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={addEmotion}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-800/80 border border-gray-700/80 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Chart Screenshot */}
      <div>
        <label className={labelClass}>Chart Screenshot</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleScreenshotSelect(e.target.files?.[0])}
        />

        {/* Show existing screenshot in edit mode */}
        {editTrade?.screenshot_url && !removeExisting && !screenshotFile && (
          <div className="mb-2">
            <div className="relative inline-block">
              <img
                src={editTrade.screenshot_url}
                alt="Current screenshot"
                className="max-h-[150px] rounded-lg border border-gray-700/80"
              />
              <button
                type="button"
                onClick={clearScreenshot}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-400 transition-colors"
              >
                &times;
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Upload a new image to replace</p>
          </div>
        )}

        {/* Preview of newly selected file */}
        {screenshotPreview && (
          <div className="mb-2">
            <div className="relative inline-block">
              <img
                src={screenshotPreview}
                alt="Screenshot preview"
                className="max-h-[150px] rounded-lg border border-gray-700/80"
              />
              <button
                type="button"
                onClick={clearScreenshot}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-400 transition-colors"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Dropzone — show when no preview */}
        {!screenshotPreview && !(editTrade?.screenshot_url && !removeExisting) && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleScreenshotSelect(e.dataTransfer.files[0]);
            }}
            className="flex flex-col items-center justify-center gap-1.5 py-6 rounded-lg border-2 border-dashed border-gray-700/80 bg-gray-800/80 cursor-pointer hover:border-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
              <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909-4.97-4.969a.75.75 0 0 0-1.06 0L2.5 11.06Zm12.22-4.81a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-500">Drop chart screenshot or click to upload</span>
            <span className="text-[10px] text-gray-600">PNG, JPG, WebP — max 5MB</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-submit w-full rounded-lg bg-accent-600 px-4 py-3 text-sm font-bold text-white hover:bg-accent-500 disabled:opacity-50"
      >
        {saving ? "Saving..." : editTrade ? "Update Trade" : "Save Trade"}
      </button>
    </form>
  );
}
