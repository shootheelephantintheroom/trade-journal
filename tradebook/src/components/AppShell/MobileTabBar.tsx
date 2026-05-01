import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface MobileTabBarProps {
  navItems: { to: string; label: string; icon: LucideIcon }[];
}

export default function MobileTabBar({ navItems }: MobileTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-0/80 backdrop-blur-xl border-t border-white/[0.04] sm:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center py-1.5">
        {navItems.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-1 py-1.5 font-medium transition-colors duration-150",
                isActive ? "text-white" : "text-zinc-600"
              )
            }
          >
            <t.icon className="w-5 h-5" />
            <span className="text-[10px] leading-none">{t.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
