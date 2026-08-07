import { NavLink } from "react-router-dom";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useAuthModalStore } from "../../store/authModalStore";
import { cn } from "../../utils/cn";

// Mobile bottom nav: the four things a buyer reaches for most, always one
// thumb-tap away. Cart opens the drawer in place rather than navigating, so
// the cart-review flow never costs a page load. Hidden on md+ (desktop nav
// covers these via the top bar instead).
export function MobileBottomNav({ onCartClick, disabled = false }: { onCartClick: () => void; disabled?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const { itemCount } = useCart();
  const openAuthModal = useAuthModalStore((s) => s.open);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] transition-fast",
      isActive ? "text-primary" : "text-text-muted"
    );

  const accountTo = !isAuthenticated
    ? undefined
    : user?.role === "supplier"
    ? "/supplier/dashboard"
    : "/buyer/profile";

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border flex items-stretch"
      style={{ height: "calc(3.5rem + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <NavLink to="/" end className={linkClass}>
        <Home className="h-5 w-5" aria-hidden />
        Home
      </NavLink>
      <NavLink to="/discover" className={linkClass}>
        <Search className="h-5 w-5" aria-hidden />
        Search
      </NavLink>
      <button
        type="button"
        onClick={onCartClick}
        disabled={disabled}
        className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] text-text-muted relative disabled:opacity-50"
      >
        <span className="relative">
          <ShoppingBag className="h-5 w-5" aria-hidden />
          {itemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full bg-accent text-white text-[9px] flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </span>
        Cart
      </button>
      {accountTo ? (
        <NavLink to={accountTo} className={linkClass}>
          <User className="h-5 w-5" aria-hidden />
          Account
        </NavLink>
      ) : (
        <button
          type="button"
          onClick={() => openAuthModal("signup")}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] text-text-muted"
        >
          <User className="h-5 w-5" aria-hidden />
          Account
        </button>
      )}
    </nav>
  );
}
