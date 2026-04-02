import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface MobileTabBarProps {
  navItems: { to: string; label: string; icon: LucideIcon }[];
}

export default function MobileTabBar({ navItems }: MobileTabBarProps) {
  return (
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
  );
}
