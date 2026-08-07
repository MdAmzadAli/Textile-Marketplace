import { api } from "./api";
import { SupplierProfile } from "../types";

export type SupplierProfileInput = Omit<SupplierProfile, "userId">;

export async function getOwnSupplierProfile() {
  const res = await api.get<{ data: SupplierProfile }>("/supplier-profile/me");
  return res.data.data;
}

export async function upsertSupplierProfile(input: SupplierProfileInput) {
  const res = await api.put<{ data: SupplierProfile }>("/supplier-profile/me", input);
  return res.data.data;
}
