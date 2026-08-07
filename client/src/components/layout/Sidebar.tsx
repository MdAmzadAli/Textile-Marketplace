import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SidebarLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  links: SidebarLink[];
  /** Seller navigation must fit all primary sections on a narrow phone. */
  seller?: boolean;
}

export function Sidebar({ links, seller = false }: SidebarProps) {
  return (
    <aside className="w-full md:w-56 shrink-0">
      <nav className={seller ? "grid grid-cols-4 gap-1 overflow-hidden md:flex md:flex-col md:overflow-visible" : "flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"}>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                seller
                  ? "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-sm px-1 py-1.5 text-center text-[10px] leading-tight transition-fast md:flex-row md:justify-start md:gap-2 md:px-3 md:py-2 md:text-sm"
                  : "flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-2 text-sm transition-fast",
                isActive
                  ? "bg-primary text-white"
                  : "text-text-primary hover:bg-bg"
              )
            }
          >
            <Icon className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
            <span className={seller ? "max-w-full truncate" : undefined}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
