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
import { invokeEdgeFunction } from "./lib/subscription";
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
import { cn } from "./lib/utils";

const tabs = [
  { to: "/app/log", label: "Log Trade", icon: "+" },
  { to: "/app/trades", label: "History", icon: "☰" },
  { to: "/app/missed", label: "Missed", icon: "◎" },
  { to: "/app/journal", label: "Journal", icon: "✎" },
  { to: "/app/analytics", label: "Analytics", icon: "▣" },
  { to: "/app/dashboard", label: "Dashboard", icon: "◈" },
];

function navClassName({ isActive }: { isActive: boolean }) {
  return cn(
    "relative px-3 py-3.5 text-sm font-medium transition-colors",
    isActive
      ? "text-primary"
      : "text-tertiary hover:text-secondary"
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
    <div className="min-h-screen bg-surface-0 text-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-0/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-0 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-primary">
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
              <div className="w-px h-5 bg-border mx-2" />
            </div>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-secondary hover:text-primary hover:bg-surface-2 transition-colors"
              >
                {displayName && (
                  <span className="hidden sm:inline">{displayName}</span>
                )}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-surface-1 py-1 shadow-xl z-50">
                  {profile?.stripe_customer_id && (
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        try {
                          const { data, error } = await invokeEdgeFunction("create-portal-session");
                          if (error) {
                            showToast("Failed to open billing portal", "error");
                            return;
                          }
                          if (data.url) window.location.href = data.url;
                        } catch {
                          showToast("Failed to open billing portal", "error");
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-secondary hover:bg-surface-2 hover:text-primary transition-colors"
                    >
                      Manage Subscription
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/app/settings"); }}
                    className="w-full text-left px-3 py-2 text-xs text-secondary hover:bg-surface-2 hover:text-primary transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="w-full text-left px-3 py-2 text-xs text-tertiary hover:bg-surface-2 hover:text-loss transition-colors"
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
        <div className="bg-amber-muted border-b border-border px-4 py-2.5 text-center text-sm text-amber">
          Your payment failed. Please update your payment method to keep Pro access.
        </div>
      )}

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-20 sm:pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-6 w-6 border-2 border-surface-3 border-t-brand rounded-full animate-spin" />
            <p className="text-sm text-tertiary">Loading...</p>
          </div>
        ) : fetchError && missedTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-secondary text-sm">
              Something went wrong, try again
            </p>
            <button
              onClick={() => {
                setLoading(true);
                fetchMissedTrades().finally(() => setLoading(false));
              }}
              className="px-4 py-2 rounded-lg bg-surface-2 text-sm text-primary hover:bg-surface-3 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div key={location.pathname} className="animate-page-enter">
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-0/80 backdrop-blur-xl border-t border-border sm:hidden">
        <div className="flex justify-around items-center py-1.5">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 transition-colors",
                  isActive ? "text-primary" : "text-tertiary"
                )
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
