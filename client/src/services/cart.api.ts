import { api } from "./api";
import { Cart } from "../types";

export async function getOwnCart() {
  const res = await api.get<{ data: Cart }>("/cart");
  return res.data.data;
}

export async function addItem(productId: string, quantity: number, selectedColor = "") {
  const res = await api.post<{ data: Cart }>("/cart/items", { productId, quantity, selectedColor });
  return res.data.data;
}

export async function mergeGuestCart(items: Array<{ productId: string; quantity: number; selectedColor: string }>) {
  const res = await api.post<{ data: Cart }>("/cart/merge", { items });
  return res.data.data;
}

export async function updateItem(itemId: string, quantity: number) {
  const res = await api.patch<{ data: Cart }>(`/cart/items/${itemId}`, { quantity });
  return res.data.data;
}

export async function removeItem(itemId: string) {
  const res = await api.delete<{ data: Cart }>(`/cart/items/${itemId}`);
  return res.data.data;
}
