import { api } from "./api";
import { Address } from "../types";

export type AddressInput = Omit<Address, "id" | "createdAt" | "updatedAt">;
export async function listAddresses() { const res = await api.get<{ data: Address[] }>("/addresses"); return res.data.data; }
export async function createAddress(input: AddressInput) { const res = await api.post<{ data: Address }>("/addresses", input); return res.data.data; }
export async function updateAddress(id: string, input: AddressInput) { const res = await api.put<{ data: Address }>(`/addresses/${id}`, input); return res.data.data; }
export async function deleteAddress(id: string) { await api.delete(`/addresses/${id}`); }
