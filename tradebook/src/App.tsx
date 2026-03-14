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
  const [pageKey, setPageKey] = useState(0);

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

  function switchTab(t: Tab) {
    setTab(t);
    setPageKey((k) => k + 1);
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "log", label: "Log Trade", icon: "+" },
    { key: "trades", label: "History", icon: "☰" },
    { key: "missed", label: "Missed", icon: "◎" },
    { key: "dashboard", label: "Dashboard", icon: "◈" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/80">
        <div className="max-w-5xl mx-auto px-4 py-0 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-white font-display">
            MyTradeBook
          </h1>
          <nav className="flex gap-0.5 items-center">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={
                  "nav-tab px-3 py-3.5 text-sm font-medium transition-colors " +
                  (tab === t.key
                    ? "nav-tab-active text-white"
                    : "text-gray-500 hover:text-gray-200")
                }
              >
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden text-base">{t.icon}</span>
              </button>
            ))}
            <div className="w-px h-5 bg-gray-800 mx-2" />
            {displayName && (
              <span className="text-xs text-gray-500 mr-1 hidden sm:inline">{displayName}</span>
            )}
            <button
              onClick={signOut}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-colors"
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
          <div key={pageKey} className="page-enter">
            {tab === "log" && (
              <div className="max-w-lg mx-auto">
                <TradeForm onSaved={fetchTrades} />
              </div>
            )}
            {tab === "trades" && (
              <TradeList
                trades={trades}
                onLogTrade={() => switchTab("log")}
              />
            )}
            {tab === "dashboard" && (
              <Dashboard
                trades={trades}
                missedTrades={missedTrades}
                onLogTrade={() => switchTab("log")}
              />
            )}
            {tab === "missed" && (
              <MissedTrades
                missedTrades={missedTrades}
                onSaved={fetchMissedTrades}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
