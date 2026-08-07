import { api } from "./api";
import { Role, User } from "../types";

interface AuthResponse {
  user: User;
  accessToken: string;
}

export async function register(email: string, password: string, role: Role) {
  const res = await api.post<{ data: AuthResponse }>("/auth/register", { email, password, role });
  return res.data.data;
}

export async function login(email: string, password: string) {
  const res = await api.post<{ data: AuthResponse }>("/auth/login", { email, password });
  return res.data.data;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function activateSeller(password?: string) {
  const res = await api.post<{ data: AuthResponse }>("/auth/activate-seller", { password });
  return res.data.data;
}

export async function activateBuyer() {
  const res = await api.post<{ data: AuthResponse }>("/auth/activate-buyer");
  return res.data.data;
}
