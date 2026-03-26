import { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
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
  { to: "/app/dashboard", label: "Dashboard", icon: "◈" },
  { to: "/app/log", label: "Log Trade", icon: "+" },
  { to: "/app/trades", label: "History", icon: "☰" },
  { to: "/app/missed", label: "Missed", icon: "◎" },
  { to: "/app/journal", label: "Journal", icon: "✎" },
  { to: "/app/analytics", label: "Analytics", icon: "▣" },
];

function navClassName({ isActive }: { isActive: boolean }) {
  return cn(
    "relative px-3 py-3.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap",
    isActive
      ? "text-white"
      : "text-zinc-500 hover:text-zinc-300"
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
  const navRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });
  const [missedTrades, setMissedTrades] = useState<MissedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [tradeRefreshKey, setTradeRefreshKey] = useState(0);

  // Sliding underline indicator
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLAnchorElement>("a.text-white");
    if (active) {
      setIndicator({
        left: active.offsetLeft,
        width: active.offsetWidth,
        ready: true,
      });
    }
  }, [location.pathname]);

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
      <header className="sticky top-0 z-40 h-14 bg-surface-0/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center">
          {/* App name */}
          <h1 className="text-lg font-[500] tracking-tight text-white shrink-0" style={{ fontFamily: "'Geist Sans', system-ui, sans-serif" }}>
            MyTradeBook
          </h1>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center relative ml-8" ref={navRef}>
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
            {/* Sliding underline indicator */}
            <span
              className="absolute bottom-0 h-0.5 bg-brand rounded-full"
              style={{
                left: indicator.left,
                width: indicator.width,
                transition: indicator.ready ? "left 250ms cubic-bezier(0.16,1,0.3,1), width 250ms cubic-bezier(0.16,1,0.3,1)" : "none",
              }}
            />
          </nav>

          <div className="flex-1" />

          {/* Avatar dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="h-8 w-8 rounded-full bg-surface-2 border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-xs font-medium text-zinc-300 hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-colors duration-150"
            >
              {displayName ? displayName.charAt(0).toUpperCase() : "?"}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-surface-1 py-1 z-50">
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
                    className="w-full text-left px-3 py-2 text-xs text-secondary hover:bg-surface-2 hover:text-primary transition-colors duration-150"
                  >
                    Manage Subscription
                  </button>
                )}
                <button
                  onClick={() => { setMenuOpen(false); navigate("/app/settings"); }}
                  className="w-full text-left px-3 py-2 text-xs text-secondary hover:bg-surface-2 hover:text-primary transition-colors duration-150"
                >
                  Settings
                </button>
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="w-full text-left px-3 py-2 text-xs text-tertiary hover:bg-surface-2 hover:text-loss transition-colors duration-150"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
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
                  "flex flex-col items-center gap-0.5 px-2 py-1 transition-colors duration-150",
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
