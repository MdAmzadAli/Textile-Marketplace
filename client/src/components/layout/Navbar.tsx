import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ShoppingBag, LayoutDashboard, Store, Search, User, ChevronDown, ClipboardList, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useCartStore } from "../../store/cartStore";
import { useCart } from "../../hooks/useCart";
import { useAuthModalStore } from "../../store/authModalStore";
import { CartDrawer } from "../cart/CartDrawer";
import { AuthModal } from "../auth/AuthModal";
import { SearchBar } from "./SearchBar";
import { CategoryStrip } from "./CategoryStrip";
import { MobileBottomNav } from "./MobileBottomNav";
import { AllItemsMenu } from "./AllItemsMenu";
import { cn } from "../../utils/cn";
import { Button, Input, Modal } from "../ui";
import { SellerNavbar } from "./SellerNavbar";

// Buyer-first navigation, left to right: logo -> All Items (full catalog
// taxonomy) -> search (the primary action, centered) -> account -> orders ->
// cart. Selling is a single secondary link before the account menu, never
// gating the buyer path. Suppliers get their own tools in the dashboard
// Sidebar (see DashboardShell) — this top bar stays the same for everyone
// so switching between "browsing" and "managing my shop" never feels like a
// different site.
export function Navbar() {
  const { user, isAuthenticated, logout, becomeSeller, switchToBuyer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const openDrawer = useCartStore((s) => s.openDrawer);
  const openAuthModal = useAuthModalStore((s) => s.open);
  const { itemCount } = useCart();
  const isBuyer = isAuthenticated && user?.role === "buyer";
  const isSupplier = isAuthenticated && user?.role === "supplier";
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sellerPasswordOpen, setSellerPasswordOpen] = useState(false);
  const [sellerPassword, setSellerPassword] = useState("");
  const [sellerBusy, setSellerBusy] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    function onClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [accountOpen]);

  // Guests can add to cart freely (guestCartStore), so the cart drawer is
  // always the right destination — signup is only asked for at checkout.
  function handleCartClick() {
    if (location.pathname === "/buyer/checkout") return;
    openDrawer();
  }

  function handleMobileCartClick() {
    if (location.pathname === "/buyer/checkout") return;
    if (isBuyer) {
      navigate("/buyer/checkout");
    } else if (!isAuthenticated) {
      openAuthModal("signup", "/buyer/checkout");
    } else {
      openDrawer();
    }
  }

  // Account control: authenticated users still get the profile dropdown
  // (dashboard/orders/logout); logged-out visitors skip the dropdown
  // entirely and land straight in the modal, signup tab first.
  function handleAccountClick() {
    if (isAuthenticated) {
      setAccountOpen((v) => !v);
    } else {
      openAuthModal("signup");
    }
  }

  async function openSellerMode(password?: string) {
    setSellerBusy(true);
    try { await becomeSeller(password); setSellerPasswordOpen(false); setSellerPassword(""); }
    catch { if (!password) setSellerPasswordOpen(true); }
    finally { setSellerBusy(false); }
  }

  if (isSupplier) return <SellerNavbar />;

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface">
        <div className="border-b border-border">
          <div className="mx-auto max-w-[1440px] px-4 md:px-6 h-14 flex items-center gap-3 md:gap-4">
            <Link to="/" className="font-display text-lg md:text-xl text-primary font-600 shrink-0">
              Textile Marketplace
            </Link>

            <div className="hidden md:block"><AllItemsMenu /></div>

            <div className="hidden md:block flex-1 min-w-0 max-w-2xl mx-auto">
              <SearchBar />
            </div>

            <nav className="flex items-center gap-1 ml-auto md:ml-0 shrink-0">
              {/* Seller entry — always present, never blocking the buyer path */}
              {isSupplier && (
                <button
                  onClick={() => navigate("/supplier/dashboard")}
                  className="hidden lg:inline-flex items-center gap-1.5 h-8 px-3 rounded-sm text-sm text-text-primary hover:bg-bg transition-fast"
                >
                  <LayoutDashboard className="h-4 w-4" /> Seller dashboard
                </button>
              )}

              {/* Account — profile dropdown when signed in, straight to the sign-up modal otherwise */}
              <div ref={accountRef} className="relative">
                <button
                  onClick={handleAccountClick}
                  aria-expanded={isAuthenticated ? accountOpen : undefined}
                  aria-haspopup={isAuthenticated ? "menu" : undefined}
                  className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-sm text-sm text-text-primary hover:bg-bg transition-fast"
                >
                  <User className="h-4 w-4" />
                  {isAuthenticated ? user?.email.split("@")[0] : "Sign in"}
                  {isAuthenticated && (
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-fast", accountOpen && "rotate-180")} />
                  )}
                </button>
                <button
                  onClick={handleAccountClick}
                  aria-label="Account"
                  className="hidden"
                >
                  <User className="h-5 w-5 text-text-primary" />
                </button>

                {isAuthenticated && accountOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-md border border-border bg-surface shadow-modal p-2 z-50">
                    <p className="px-3 py-1 text-xs text-text-muted truncate">{user?.email}</p>
                    {isBuyer && (
                      <Link
                        to="/buyer/profile"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm hover:bg-bg"
                      >
                        <User className="h-4 w-4" /> Profile
                      </Link>
                    )}
                    {isBuyer && <Link to="/buyer/addresses" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm hover:bg-bg"><MapPin className="h-4 w-4" /> Manage addresses</Link>}
                    {isBuyer && (
                      <Link to="/buyer/orders" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm hover:bg-bg">
                        <ClipboardList className="h-4 w-4" /> Orders
                      </Link>
                    )}
                    {isSupplier && (
                      <Link
                        to="/supplier/dashboard"
                        onClick={() => setAccountOpen(false)}
                        className="block px-3 py-2 rounded-sm text-sm hover:bg-bg lg:hidden"
                      >
                        Seller dashboard
                      </Link>
                    )}
                    {isSupplier && <Link to="/supplier/profile" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm hover:bg-bg"><User className="h-4 w-4" /> Seller account</Link>}
                    {isBuyer && <button onClick={() => { setAccountOpen(false); openSellerMode(); }} className="w-full text-left px-3 py-2 rounded-sm text-sm hover:bg-bg flex items-center gap-2"><Store className="h-4 w-4" /> {user?.sellerEnabled ? "Switch to selling" : "Become a Seller"}</button>}
                    {isSupplier && <button onClick={async () => { setAccountOpen(false); await switchToBuyer(); }} className="w-full text-left px-3 py-2 rounded-sm text-sm hover:bg-bg flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Switch to buying</button>}
                    <button
                      onClick={() => {
                        setAccountOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-sm text-sm hover:bg-bg flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                )}
              </div>

              {/* Returns & Orders — buyer purchase history */}
              <button
                onClick={handleCartClick}
                className="relative hidden md:inline-flex items-center gap-1.5 h-8 px-2 md:px-3 rounded-sm text-sm text-text-primary hover:bg-bg transition-fast"
              >
                <ShoppingBag className="h-5 w-5 md:h-4 md:w-4" />
                <span className="hidden md:inline">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              <div className="md:hidden">
                <AllItemsMenu mobile />
              </div>
              <button
                type="button"
                onClick={() => setMobileSearchOpen((v) => !v)}
                className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-sm hover:bg-bg transition-fast"
                aria-label="Search"
                aria-expanded={mobileSearchOpen}
              >
                <Search className="h-5 w-5 text-text-primary" aria-hidden />
              </button>
            </nav>
          </div>

          {mobileSearchOpen && (
            <div className="md:hidden px-4 pb-3">
              <SearchBar autoFocus />
            </div>
          )}
        </div>

        <CategoryStrip />
      </header>

      <CartDrawer />
      <AuthModal />
      <MobileBottomNav onCartClick={handleMobileCartClick} disabled={location.pathname === "/buyer/checkout"} />
      <Modal open={sellerPasswordOpen} onClose={() => setSellerPasswordOpen(false)} title="Resume seller access" size="sm"><form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); openSellerMode(sellerPassword); }}><p className="text-sm text-text-muted">Confirm your account password to resume seller access for 30 days.</p><Input label="Password" type="password" required autoFocus value={sellerPassword} onChange={(event) => setSellerPassword(event.target.value)} /><Button type="submit" loading={sellerBusy}>Continue to seller setup</Button></form></Modal>
    </>
  );
}
