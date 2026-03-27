import { useEffect, useState, useCallback } from "react";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Settings as SettingsIcon,
  LogOut,
  CreditCard,
  ChevronLeft,
  Menu,
} from "lucide-react";
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

const navItems = [
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/log", label: "Log Trade" },
  { to: "/app/trades", label: "History" },
  { to: "/app/missed", label: "Missed" },
  { to: "/app/journal", label: "Journal" },
  { to: "/app/analytics", label: "Analytics" },
];

export default function App() {
  const { signOut, displayName } = useAuth();
  const { isPastDue, profile, loading: profileLoading } = useSubscription();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [missedTrades, setMissedTrades] = useState<MissedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [tradeRefreshKey, setTradeRefreshKey] = useState(0);

  const editingTrade =
    (location.state as { editTrade?: Trade } | null)?.editTrade ?? null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest?.("[data-user-menu]")) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0">
        <div className="h-8 w-8 rounded-md bg-brand/10 flex items-center justify-center">
          <span className="text-brand font-bold text-sm">M</span>
        </div>
        {!sidebarCollapsed && (
          <span className="text-[15px] font-semibold text-white tracking-tight">
            MyTradeBook
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pt-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150",
                sidebarCollapsed && "justify-center px-2",
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              )
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-3 space-y-1 shrink-0">
        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-md text-[13px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors duration-150 w-full"
        >
          <ChevronLeft
            size={18}
            strokeWidth={1.8}
            className={cn(
              "shrink-0 transition-transform duration-200",
              sidebarCollapsed && "rotate-180"
            )}
          />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>

        {/* Divider */}
        <div className="h-px bg-white/[0.04] mx-2 my-1" />

        {/* User menu */}
        <div className="relative" data-user-menu>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              "flex items-center gap-3 px-3 py-1.5 rounded-md w-full hover:bg-white/[0.04] transition-colors duration-150",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <div className="h-7 w-7 rounded-full bg-surface-3 border border-white/[0.04] flex items-center justify-center text-[11px] font-medium text-zinc-300 shrink-0">
              {displayName ? displayName.charAt(0).toUpperCase() : "?"}
            </div>
            {!sidebarCollapsed && (
              <span className="text-[13px] text-zinc-400 truncate text-left flex-1">
                {displayName || "Account"}
              </span>
            )}
          </button>

          {menuOpen && (
            <div
              className={cn(
                "absolute bottom-full mb-1 w-48 rounded-md border border-white/[0.04] bg-surface-1 py-1 z-50",
                sidebarCollapsed ? "left-full ml-2" : "left-2"
              )}
            >
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
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-[13px] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors duration-150"
                >
                  <CreditCard size={15} strokeWidth={1.8} />
                  Manage Subscription
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); navigate("/app/settings"); }}
                className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-[13px] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors duration-150"
              >
                <SettingsIcon size={15} strokeWidth={1.8} />
                Settings
              </button>
              <button
                onClick={() => { setMenuOpen(false); signOut(); }}
                className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-[13px] text-zinc-400 hover:bg-white/[0.04] hover:text-loss transition-colors duration-150"
              >
                <LogOut size={15} strokeWidth={1.8} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen flex bg-surface-0 text-primary overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden sm:flex flex-col border-r border-white/[0.04] bg-surface-0 shrink-0 transition-[width] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          sidebarCollapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-[220px] flex flex-col border-r border-white/[0.04] bg-surface-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] sm:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar - mobile only for hamburger + minimal info, desktop for breadcrumb area */}
        <header className="h-12 flex items-center gap-3 px-4 sm:px-6 border-b border-white/[0.04] shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="sm:hidden p-1 -ml-1 text-zinc-400 hover:text-white transition-colors"
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>
          <h1 className="text-[13px] font-medium text-zinc-400">
            {navItems.find((n) => location.pathname.startsWith(n.to))?.label || "MyTradeBook"}
          </h1>
          <div className="flex-1" />
          {isPastDue && (
            <span className="text-xs text-amber bg-amber/10 px-2.5 py-1 rounded-md font-medium">
              Payment failed
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
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
                      <div className="max-w-xl mx-auto">
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
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-0/80 backdrop-blur-xl border-t border-white/[0.04] sm:hidden">
        <div className="flex justify-around items-center py-1.5">
          {navItems.slice(0, 5).map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center px-2 py-1.5 text-[13px] font-medium transition-colors duration-150",
                  isActive ? "text-white" : "text-zinc-600"
                )
              }
            >
              <span>{t.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
