import { api } from "./api";
import { BuyerProfile } from "../types";

export type BuyerProfileInput = Omit<BuyerProfile, "userId" | "onboardingCompleted">;

export async function getOwnProfile() {
  const res = await api.get<{ data: BuyerProfile }>("/buyer-profile/me");
  return res.data.data;
}

export async function upsertProfile(input: BuyerProfileInput) {
  const res = await api.put<{ data: BuyerProfile }>("/buyer-profile/me", input);
  return res.data.data;
}
