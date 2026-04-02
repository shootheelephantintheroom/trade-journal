import { NavLink } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { cn } from "../../lib/utils";
import UserMenu from "./UserMenu";

interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  navItems: { to: string; label: string; icon: LucideIcon }[];
}

export default function Sidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  navItems,
}: SidebarProps) {
  const { profile } = useSubscription();

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0">
        <div className="h-8 w-8 rounded-md bg-brand/10 flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-brand font-bold text-sm">M</span>
          )}
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
            <item.icon size={18} strokeWidth={1.8} className="shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-3 space-y-1 shrink-0">
        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setSidebarCollapsed((c: boolean) => !c)}
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
        <UserMenu sidebarCollapsed={sidebarCollapsed} />
      </div>
    </>
  );
}
