import { MapPin, User, ClipboardList } from "lucide-react";
import { SidebarLink } from "../../components/layout/Sidebar";

export const BUYER_SIDEBAR_LINKS: SidebarLink[] = [
  { to: "/buyer/profile", label: "Profile", icon: User },
  { to: "/buyer/addresses", label: "Addresses", icon: MapPin },
  { to: "/buyer/orders", label: "Orders", icon: ClipboardList },
];
