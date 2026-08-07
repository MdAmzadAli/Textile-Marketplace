import { LayoutDashboard, Package, ClipboardList, Building2 } from "lucide-react";
import { SidebarLink } from "../../components/layout/Sidebar";

export const SUPPLIER_SIDEBAR_LINKS: SidebarLink[] = [
  { to: "/supplier/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/supplier/inventory", label: "Inventory", icon: Package },
  { to: "/supplier/orders", label: "Orders", icon: ClipboardList },
  { to: "/supplier/profile", label: "Profile", icon: Building2 },
];
