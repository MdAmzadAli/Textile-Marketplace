import { create } from "zustand";

export type AuthModalMode = "signup" | "login";

interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  redirectTo: string | null;
  open: (mode?: AuthModalMode, redirectTo?: string) => void;
  close: () => void;
  setMode: (mode: AuthModalMode) => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: "signup",
  redirectTo: null,
  open: (mode = "signup", redirectTo) => set({ isOpen: true, mode, redirectTo: redirectTo ?? null }),
  close: () => set({ isOpen: false, redirectTo: null }),
  setMode: (mode) => set({ mode }),
}));
