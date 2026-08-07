import { Link, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function SellerNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return <header className="sticky top-0 z-40 border-b border-border bg-surface"><div className="mx-auto flex h-14 max-w-[1440px] items-center gap-1 px-4 md:px-6"><Link to="/supplier/dashboard" className="font-display text-lg font-600 text-primary">Shop Manager</Link><div className="ml-auto flex items-center gap-1"><button onClick={() => navigate("/supplier/profile")} className="inline-flex h-9 items-center gap-2 rounded-sm px-3 text-sm hover:bg-bg"><User className="h-4 w-4" /><span className="hidden sm:inline">Account</span></button><button onClick={() => logout()} className="inline-flex h-9 items-center gap-2 rounded-sm px-3 text-sm hover:bg-bg"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Log out</span></button></div></div></header>;
}
