import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { calcPnl } from "../lib/calc";
import { todayLocal } from "../lib/date";
import { useToast } from "./Toast";
import type { JournalEntry, JournalMood, JournalGrade } from "../types/journal";
import type { Trade } from "../types/trade";

const MOODS: { value: JournalMood; label: string; emoji: string }[] = [
  { value: "great", label: "Great", emoji: "🟢" },
  { value: "good", label: "Good", emoji: "🔵" },
  { value: "neutral", label: "Neutral", emoji: "⚪" },
  { value: "frustrated", label: "Frustrated", emoji: "🟠" },
  { value: "tilted", label: "Tilted", emoji: "🔴" },
];

const GRADES = [
  { value: "A" as const, label: "A", desc: "Textbook", bg: "bg-accent-500/15", border: "border-accent-500", text: "text-accent-400", activeBg: "bg-accent-500/25" },
  { value: "B" as const, label: "B", desc: "Good", bg: "bg-blue-500/15", border: "border-blue-500", text: "text-blue-400", activeBg: "bg-blue-500/25" },
  { value: "C" as const, label: "C", desc: "Sloppy", bg: "bg-yellow-500/15", border: "border-yellow-500", text: "text-yellow-400", activeBg: "bg-yellow-500/25" },
  { value: "D" as const, label: "D", desc: "Broke rules", bg: "bg-red-500/15", border: "border-red-500", text: "text-red-400", activeBg: "bg-red-500/25" },
];

const inputClass =
  "w-full rounded-lg border border-gray-700/80 bg-gray-800/80 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none transition-colors resize-none";
const labelClass =
  "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

export default function Journal() {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [datesWithEntries, setDatesWithEntries] = useState<Set<string>>(new Set());
  const [dayTrades, setDayTrades] = useState<Trade[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryRef = useRef(entry);
  entryRef.current = entry;

  // Fetch all dates that have journal entries (for dot indicators)
  const fetchEntryDates = useCallback(async () => {
    const { data } = await supabase
      .from("journal_entries")
      .select("entry_date");
    if (data) {
      setDatesWithEntries(new Set(data.map((d) => d.entry_date)));
    }
  }, []);

  // Fetch trades for the selected date
  const fetchDayTrades = useCallback(async (date: string) => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .eq("trade_date", date)
      .order("entry_time", { ascending: true });
    setDayTrades((data as Trade[]) || []);
  }, []);

  // Fetch or create journal entry for selected date
  const fetchEntry = useCallback(async (date: string) => {
    setLoading(true);
    setSaveStatus("idle");

    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("entry_date", date)
      .maybeSingle();

    if (error) {
      showToast("Failed to load journal entry", "error");
      setLoading(false);
      return;
    }

    if (data) {
      setEntry(data as JournalEntry);
    } else {
      // Auto-create entry for this date
      const { data: newEntry, error: insertError } = await supabase
        .from("journal_entries")
        .insert({ entry_date: date })
        .select()
        .single();

      if (insertError) {
        showToast("Failed to create journal entry", "error");
        setEntry(null);
      } else {
        setEntry(newEntry as JournalEntry);
        setDatesWithEntries((prev) => new Set([...prev, date]));
      }
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchEntry(selectedDate);
    fetchDayTrades(selectedDate);
    fetchEntryDates();
  }, [selectedDate, fetchEntry, fetchDayTrades, fetchEntryDates]);

  // Auto-save with debounce
  const saveEntry = useCallback(async (updates: Partial<JournalEntry>) => {
    if (!entryRef.current) return;
    setSaveStatus("saving");

    const { error } = await supabase
      .from("journal_entries")
      .update(updates)
      .eq("id", entryRef.current.id);

    if (error) {
      showToast("Failed to save", "error");
      setSaveStatus("idle");
    } else {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    }
  }, [showToast]);

  function updateField<K extends keyof JournalEntry>(key: K, value: JournalEntry[K]) {
    if (!entry) return;
    setEntry({ ...entry, [key]: value });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveEntry({ [key]: value });
    }, 1000);
  }

  // Trade summary calculations
  const tradeCount = dayTrades.length;
  const totalPnl = dayTrades.reduce((sum, t) => sum + calcPnl(t), 0);
  const wins = dayTrades.filter((t) => calcPnl(t) > 0).length;
  const winRate = tradeCount > 0 ? Math.round((wins / tradeCount) * 100) : 0;

  const isToday = selectedDate === todayLocal();
  const hasTradesNoEntry = isToday && tradeCount > 0 && entry && !entry.premarket_plan && !entry.postmarket_review && !entry.lessons && !entry.mood && !entry.grade;

  // Calendar helpers
  const { year, month } = calendarMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function prevMonth() {
    setCalendarMonth((m) => m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 });
  }
  function nextMonth() {
    setCalendarMonth((m) => m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 });
  }

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Left sidebar — Calendar */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="card-panel p-4 sticky top-24">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-white">{monthLabel}</span>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-gray-600 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const ds = dateStr(day);
              const isSelected = ds === selectedDate;
              const hasEntry = datesWithEntries.has(ds);
              const isFuture = ds > todayLocal();

              return (
                <button
                  key={ds}
                  onClick={() => !isFuture && setSelectedDate(ds)}
                  disabled={isFuture}
                  className={`relative py-1.5 rounded text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-accent-500/20 text-accent-400 border border-accent-500/40"
                      : isFuture
                        ? "text-gray-700 cursor-not-allowed"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {day}
                  {hasEntry && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick nav */}
          <button
            onClick={() => {
              const today = todayLocal();
              setSelectedDate(today);
              const d = new Date();
              setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
            }}
            className="mt-3 w-full text-center text-xs text-gray-500 hover:text-accent-400 transition-colors py-1.5 rounded-lg hover:bg-gray-800/60"
          >
            Go to today
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-2xl space-y-5">
        {/* Header with date and save status */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-display tracking-tight">Journal</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile date picker */}
            <input
              type="date"
              value={selectedDate}
              max={todayLocal()}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="md:hidden rounded-lg border border-gray-700/80 bg-gray-800/80 px-2 py-1.5 text-xs text-white focus:border-accent-500 focus:outline-none"
            />
            {/* Save status */}
            <span className={`text-xs font-medium transition-opacity ${saveStatus === "idle" ? "opacity-0" : "opacity-100"} ${saveStatus === "saving" ? "text-yellow-400" : "text-accent-400"}`}>
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : ""}
            </span>
          </div>
        </div>

        {/* Reflection banner */}
        {hasTradesNoEntry && (
          <div className="card-panel px-4 py-3 border-accent-500/30 bg-accent-500/5">
            <p className="text-sm text-accent-400">
              You took <span className="font-bold">{tradeCount} trade{tradeCount !== 1 ? "s" : ""}</span> today. Take a minute to reflect.
            </p>
          </div>
        )}

        {/* Trades summary */}
        {tradeCount > 0 && (
          <div className="card-panel px-4 py-3 flex flex-wrap gap-x-6 gap-y-1.5">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Trades <span className="text-sm font-bold text-white ml-1">{tradeCount}</span>
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              P&L{" "}
              <span className={`text-sm font-bold ml-1 ${totalPnl >= 0 ? "text-accent-400" : "text-red-400"}`}>
                {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
              </span>
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Win Rate <span className="text-sm font-bold text-white ml-1">{winRate}%</span>
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-6 w-6 border-2 border-gray-600 border-t-accent-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : entry ? (
          <div className="space-y-5">
            {/* Pre-market Plan */}
            <div className="form-section">
              <label className={labelClass}>Pre-market Plan</label>
              <textarea
                className={inputClass}
                rows={4}
                placeholder="What's on your watchlist? What setups are you looking for?"
                value={entry.premarket_plan}
                onChange={(e) => updateField("premarket_plan", e.target.value)}
              />
            </div>

            {/* Post-market Review */}
            <div className="form-section">
              <label className={labelClass}>Post-market Review</label>
              <textarea
                className={inputClass}
                rows={4}
                placeholder="How did the day go? What worked, what didn't?"
                value={entry.postmarket_review}
                onChange={(e) => updateField("postmarket_review", e.target.value)}
              />
            </div>

            {/* Lessons Learned */}
            <div className="form-section">
              <label className={labelClass}>Lessons Learned</label>
              <textarea
                className={inputClass}
                rows={3}
                placeholder="What will you do differently?"
                value={entry.lessons}
                onChange={(e) => updateField("lessons", e.target.value)}
              />
            </div>

            {/* Mood */}
            <div>
              <label className={labelClass}>Mood</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => updateField("mood", entry.mood === m.value ? null : m.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      entry.mood === m.value
                        ? m.value === "great"
                          ? "bg-accent-500/20 border-accent-500/50 text-accent-400"
                          : m.value === "good"
                            ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                            : m.value === "neutral"
                              ? "bg-gray-500/20 border-gray-500/50 text-gray-300"
                              : m.value === "frustrated"
                                ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                                : "bg-red-500/20 border-red-500/50 text-red-400"
                        : "bg-gray-800/80 border-gray-700/80 text-gray-500 hover:border-gray-600"
                    }`}
                  >
                    <span className="mr-1.5">{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Grade */}
            <div>
              <label className={labelClass}>Day Grade</label>
              <div className="flex gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => updateField("grade", entry.grade === g.value ? null : g.value)}
                    className={`grade-btn flex-1 py-2 rounded-lg text-center border font-bold text-sm ${
                      entry.grade === g.value
                        ? `${g.activeBg} ${g.border} ${g.text}`
                        : "bg-gray-800/80 border-gray-700/80 text-gray-500 hover:border-gray-600"
                    }`}
                  >
                    <span className="text-base">{g.label}</span>
                    <span className="block text-[10px] font-medium opacity-70 mt-0.5">{g.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goals for Tomorrow */}
            <div className="form-section">
              <label className={labelClass}>Goals for Tomorrow</label>
              <textarea
                className={inputClass}
                rows={3}
                placeholder="What do you want to focus on next session?"
                value={entry.goals_for_tomorrow}
                onChange={(e) => updateField("goals_for_tomorrow", e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500">Could not load journal entry.</p>
          </div>
        )}
      </div>
    </div>
  );
}
