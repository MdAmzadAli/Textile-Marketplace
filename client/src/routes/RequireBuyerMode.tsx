import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/** Guests may browse the catalog, but seller mode is intentionally confined to Shop Manager. */
export function RequireBuyerMode() {
  const user = useAuthStore((state) => state.user);
  return user?.role === "supplier" ? <Navigate to="/supplier/dashboard" replace /> : <Outlet />;
}
