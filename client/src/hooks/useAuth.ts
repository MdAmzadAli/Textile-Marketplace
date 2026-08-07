import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import { useGuestCartStore } from "../store/guestCartStore";
import * as authApi from "../services/auth.api";
import * as cartApi from "../services/cart.api";
import { Role } from "../types";

interface AuthOptions {
  /** Where to go after success. Defaults to the normal onboarding/dashboard redirect. */
  redirectTo?: string;
}

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const push = useToastStore((s) => s.push);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Guest cart items were added without an account — fold them into the
  // buyer's real server cart the moment they authenticate so nothing is
  // lost, then clear local storage so it isn't merged twice.
  async function mergeGuestCart(role: Role) {
    if (role !== "buyer") return true;
    const guestItems = useGuestCartStore.getState().items;
    if (guestItems.length === 0) return true;
    try {
      const cart = await cartApi.mergeGuestCart(guestItems.map(({ productId, quantity, selectedColor }) => ({ productId, quantity, selectedColor })));
      queryClient.setQueryData(["cart"], cart);
      useGuestCartStore.getState().clear();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      return true;
    } catch (error: any) {
      push(error?.response?.data?.error?.message || "Your cart was kept locally. Please retry checkout.", "error");
      // Non-fatal — worst case the guest items just stay in local storage
      // and the user can re-add manually. Auth itself already succeeded.
    }
  }

  async function login(email: string, password: string, options?: AuthOptions) {
    const hadGuestCart = useGuestCartStore.getState().items.length > 0;
    const result = await authApi.login(email, password);
    setAuth(result.user, result.accessToken);
    await mergeGuestCart(result.user.role);
    push("Welcome back!", "success");
    navigate(options?.redirectTo ?? (result.user.role === "supplier" ? "/supplier/dashboard" : hadGuestCart ? "/buyer/checkout" : "/buyer/onboarding"));
  }

  async function register(email: string, password: string, role: Role, options?: AuthOptions) {
    const hadGuestCart = useGuestCartStore.getState().items.length > 0;
    const result = await authApi.register(email, password, role);
    setAuth(result.user, result.accessToken);
    await mergeGuestCart(result.user.role);
    push("Account created", "success");
    navigate(options?.redirectTo ?? (role === "supplier" ? "/supplier/onboarding" : hadGuestCart ? "/buyer/checkout" : "/buyer/onboarding"));
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      push("Logged out", "info");
      navigate("/login");
    }
  }

  async function becomeSeller(password?: string) {
    const result = await authApi.activateSeller(password);
    setAuth(result.user, result.accessToken);
    navigate("/supplier/onboarding");
  }

  async function switchToBuyer() {
    const result = await authApi.activateBuyer();
    setAuth(result.user, result.accessToken);
    navigate("/discover");
  }

  return { user, accessToken, isAuthenticated: !!user, login, register, logout, becomeSeller, switchToBuyer };
}
