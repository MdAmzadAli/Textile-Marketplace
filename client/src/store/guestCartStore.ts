import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Cart, CartItem, Product } from "../types";

// Lets anyone add to cart before creating an account (checkpoint task #6).
// Shaped exactly like the server Cart/CartItem so every component that
// reads from useCart() (CartDrawer, CartPage, CheckoutPage, ProductCard)
// works unmodified whether the source is this store or the API. The
// productId doubles as the line-item id since a guest can only ever have
// one line per product.
interface GuestCartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number, selectedColor?: string) => void;
  updateItem: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clear: () => void;
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity, selectedColor = "") => {
        const safeQuantity = Math.max(product.moq, Math.min(quantity, product.stock));
        const existing = get().items.find((i) => i.productId === product.id && i.selectedColor === selectedColor);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === product.id && i.selectedColor === selectedColor
                ? { ...i, quantity: Math.min(i.quantity + safeQuantity, product.stock), product }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              { id: `${product.id}:${selectedColor}`, cartId: "guest", productId: product.id, quantity: safeQuantity, selectedColor, product },
            ],
          });
        }
      },
      updateItem: (itemId, quantity) => {
        set({
          items: get().items.map((i) =>
            i.id === itemId
              ? { ...i, quantity: Math.max(i.product.moq, Math.min(quantity, i.product.stock)) }
              : i
          ),
        });
      },
      removeItem: (itemId) => {
        set({ items: get().items.filter((i) => i.id !== itemId) });
      },
      clear: () => set({ items: [] }),
    }),
    { name: "guest-cart-storage" }
  )
);

export function guestCartAsCart(items: CartItem[]): Cart {
  return { id: "guest", buyerId: "guest", items };
}
