import { useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabase";
import type { Trade, MissedTrade } from "./types/trade";
import TradeForm from "./components/TradeForm";
import TradeList from "./components/TradeList";
import Dashboard from "./components/Dashboard";
import MissedTrades from "./components/MissedTrades";
import { useAuth } from "./contexts/AuthContext";
import { useToast } from "./components/Toast";

type Tab = "log" | "trades" | "dashboard" | "missed";

export default function App() {
  const { signOut, displayName } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("log");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [missedTrades, setMissedTrades] = useState<MissedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchTrades = useCallback(async () => {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("trade_date", { ascending: false })
      .order("entry_time", { ascending: false });
    if (error) {
      showToast("Failed to load trades", "error");
      setFetchError(true);
      return;
    }
    setFetchError(false);
    setTrades((data as Trade[]) || []);
  }, [showToast]);

  const fetchMissedTrades = useCallback(async () => {
    const { data, error } = await supabase
      .from("missed_trades")
      .select("*")
      .order("trade_date", { ascending: false });
    if (error) {
      showToast("Failed to load missed trades", "error");
      setFetchError(true);
      return;
    }
    setFetchError(false);
    setMissedTrades((data as MissedTrade[]) || []);
  }, [showToast]);

  useEffect(() => {
    Promise.all([fetchTrades(), fetchMissedTrades()]).finally(() =>
      setLoading(false)
    );
  }, [fetchTrades, fetchMissedTrades]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "log", label: "Log Trade" },
    { key: "trades", label: "History" },
    { key: "missed", label: "Missed" },
    { key: "dashboard", label: "Dashboard" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-white">
            TradeBook
          </h1>
          <nav className="flex gap-1 items-center">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                  (tab === t.key
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50")
                }
              >
                {t.label}
              </button>
            ))}
            <div className="w-px h-5 bg-gray-700 mx-1" />
            {displayName && (
              <span className="text-sm text-gray-400 mr-1">{displayName}</span>
            )}
            <button
              onClick={signOut}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-6 w-6 border-2 border-gray-600 border-t-accent-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : fetchError && trades.length === 0 && missedTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-gray-400 text-sm">
              Something went wrong, try again
            </p>
            <button
              onClick={() => {
                setLoading(true);
                Promise.all([fetchTrades(), fetchMissedTrades()]).finally(() =>
                  setLoading(false)
                );
              }}
              className="px-4 py-2 rounded-lg bg-gray-800 text-sm text-white hover:bg-gray-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {tab === "log" && (
              <div className="max-w-lg mx-auto">
                <TradeForm onSaved={fetchTrades} />
              </div>
            )}
            {tab === "trades" && (
              <TradeList
                trades={trades}
                onLogTrade={() => setTab("log")}
              />
            )}
            {tab === "dashboard" && (
              <Dashboard
                trades={trades}
                missedTrades={missedTrades}
                onLogTrade={() => setTab("log")}
              />
            )}
            {tab === "missed" && (
              <MissedTrades
                missedTrades={missedTrades}
                onSaved={fetchMissedTrades}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
