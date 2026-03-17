import { useEffect, useState, useCallback, useRef } from "react";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import type { Trade, MissedTrade } from "./types/trade";
import TradeForm from "./components/TradeForm";
import TradeList from "./components/TradeList";
import Dashboard from "./components/Dashboard";
import MissedTrades from "./components/MissedTrades";
import Journal from "./components/Journal";
import Analytics from "./components/Analytics";
import PaywallGate from "./components/PaywallGate";
import Onboarding from "./components/Onboarding";
import Settings from "./components/Settings";
import { useAuth } from "./contexts/AuthContext";
import { useSubscription } from "./contexts/SubscriptionContext";
import { useToast } from "./components/Toast";

const tabs = [
  { to: "/app/log", label: "Log Trade", icon: "+" },
  { to: "/app/trades", label: "History", icon: "☰" },
  { to: "/app/missed", label: "Missed", icon: "◎" },
  { to: "/app/journal", label: "Journal", icon: "✎" },
  { to: "/app/analytics", label: "Analytics", icon: "▣" },
  { to: "/app/dashboard", label: "Dashboard", icon: "◈" },
];

function navClassName({ isActive }: { isActive: boolean }) {
  return (
    "nav-tab px-3 py-3.5 text-sm font-medium transition-colors " +
    (isActive
      ? "nav-tab-active text-white"
      : "text-gray-500 hover:text-gray-200")
  );
}

export default function App() {
  const { signOut, displayName } = useAuth();
  const { isPastDue, profile, loading: profileLoading } = useSubscription();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [missedTrades, setMissedTrades] = useState<MissedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [tradeRefreshKey, setTradeRefreshKey] = useState(0);

  const editingTrade =
    (location.state as { editTrade?: Trade } | null)?.editTrade ?? null;

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
    fetchMissedTrades().finally(() => setLoading(false));
  }, [fetchMissedTrades]);

  const handleTradeChanged = useCallback(() => {
    setTradeRefreshKey((k) => k + 1);
  }, []);

  // Show onboarding for users who haven't completed it
  if (!profileLoading && profile && !profile.onboarded) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/80">
        <div className="max-w-5xl mx-auto px-4 py-0 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-white font-display">
            MyTradeBook
          </h1>
          <nav className="flex gap-0.5 items-center">
            <div className="hidden sm:contents">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end
                  className={navClassName}
                >
                  {t.label}
                </NavLink>
              ))}
              <div className="w-px h-5 bg-gray-800 mx-2" />
            </div>
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
                  {profile?.stripe_customer_id && (
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
                          if (!res.ok || data.error) {
                            showToast(data.error || "Failed to open billing portal", "error");
                            return;
                          }
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
                    onClick={() => { setMenuOpen(false); navigate("/app/settings"); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    Settings
                  </button>
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

      {/* Past-due payment warning */}
      {isPastDue && (
        <div className="bg-amber-900/60 border-b border-amber-700/50 px-4 py-2.5 text-center text-sm text-amber-200">
          Your payment failed. Please update your payment method to keep Pro access.
        </div>
      )}

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-20 sm:pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-6 w-6 border-2 border-gray-600 border-t-accent-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : fetchError && missedTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-gray-400 text-sm">
              Something went wrong, try again
            </p>
            <button
              onClick={() => {
                setLoading(true);
                fetchMissedTrades().finally(() => setLoading(false));
              }}
              className="px-4 py-2 rounded-lg bg-gray-800 text-sm text-white hover:bg-gray-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div key={location.pathname} className="page-enter">
            <Routes>
              <Route index element={<Navigate to="/app/log" replace />} />
              <Route
                path="log"
                element={
                  <div className="max-w-lg mx-auto">
                    <TradeForm
                      onSaved={handleTradeChanged}
                      editTrade={editingTrade}
                      onEditDone={() =>
                        navigate(".", { replace: true, state: {} })
                      }
                    />
                  </div>
                }
              />
              <Route
                path="trades"
                element={
                  <TradeList
                    onLogTrade={() => navigate("/app/log")}
                    onEdit={(trade) =>
                      navigate("/app/log", { state: { editTrade: trade } })
                    }
                    refreshKey={tradeRefreshKey}
                  />
                }
              />
              <Route
                path="missed"
                element={
                  <MissedTrades
                    missedTrades={missedTrades}
                    onSaved={fetchMissedTrades}
                  />
                }
              />
              <Route
                path="journal"
                element={
                  <PaywallGate feature="Journal">
                    <Journal />
                  </PaywallGate>
                }
              />
              <Route
                path="analytics"
                element={
                  <PaywallGate feature="Analytics">
                    <Analytics />
                  </PaywallGate>
                }
              />
              <Route
                path="dashboard"
                element={
                  <Dashboard
                    missedTrades={missedTrades}
                    onLogTrade={() => navigate("/app/log")}
                  />
                }
              />
              <Route path="settings" element={<Settings />} />
            </Routes>
          </div>
        )}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/80 backdrop-blur-xl border-t border-gray-800/80 sm:hidden">
        <div className="flex justify-around items-center py-1.5">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                "flex flex-col items-center gap-0.5 px-2 py-1 transition-colors " +
                (isActive ? "text-white" : "text-gray-500")
              }
            >
              <span className="text-base leading-none">{t.icon}</span>
              <span className="text-[10px] leading-tight">{t.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
