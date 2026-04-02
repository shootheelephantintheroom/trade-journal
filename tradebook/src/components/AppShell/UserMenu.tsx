import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  LogOut,
  CreditCard,
} from "lucide-react";
import { invokeEdgeFunction } from "../../lib/subscription";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { useToast } from "../Toast";
import { cn } from "../../lib/utils";

interface UserMenuProps {
  sidebarCollapsed: boolean;
}

export default function UserMenu({ sidebarCollapsed }: UserMenuProps) {
  const { signOut, displayName } = useAuth();
  const { profile } = useSubscription();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <div className="relative" data-user-menu>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className={cn(
          "flex items-center gap-3 px-3 py-1.5 rounded-md w-full hover:bg-white/[0.04] transition-colors duration-150",
          sidebarCollapsed && "justify-center px-2"
        )}
      >
        <div className="h-7 w-7 rounded-full bg-surface-3 border border-white/[0.04] flex items-center justify-center text-[11px] font-medium text-zinc-300 shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            displayName ? displayName.charAt(0).toUpperCase() : "?"
          )}
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
  );
}
