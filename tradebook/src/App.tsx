import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./lib/supabase";
import type { Trade, MissedTrade } from "./types/trade";
import TradeForm from "./components/TradeForm";
import TradeList from "./components/TradeList";
import Dashboard from "./components/Dashboard";
import MissedTrades from "./components/MissedTrades";
import { useAuth } from "./contexts/AuthContext";
import { useSubscription } from "./contexts/SubscriptionContext";
import { useToast } from "./components/Toast";

type Tab = "log" | "trades" | "dashboard" | "missed";

export default function App() {
  const { signOut, displayName } = useAuth();
  const { isPro } = useSubscription();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const [tab, setTab] = useState<Tab>("log");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [missedTrades, setMissedTrades] = useState<MissedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [pageKey, setPageKey] = useState(0);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

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
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors"
              >
                {displayName && (
                  <span className="hidden sm:inline">{displayName}</span>
                )}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-800 bg-gray-900 py-1 shadow-xl z-50">
                  {isPro && (
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (!session) return;
                          const res = await fetch(
                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
                            {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${session.access_token}`,
                                "Content-Type": "application/json",
                              },
                            }
                          );
                          const data = await res.json();
                          if (data.url) window.location.href = data.url;
                        } catch {
                          showToast("Failed to open billing portal", "error");
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      Manage Subscription
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
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
                <TradeForm
                  onSaved={fetchTrades}
                  editTrade={editingTrade}
                  onEditDone={() => setEditingTrade(null)}
                />
              </div>
            )}
            {tab === "trades" && (
              <TradeList
                trades={trades}
                onLogTrade={() => switchTab("log")}
                onEdit={(trade) => {
                  setEditingTrade(trade);
                  switchTab("log");
                }}
                onDelete={fetchTrades}
                onImported={fetchTrades}
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
