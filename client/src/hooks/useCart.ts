import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as cartApi from "../services/cart.api";
import { useToastStore } from "../store/toastStore";
import { useAuthStore } from "../store/authStore";
import { useGuestCartStore, guestCartAsCart } from "../store/guestCartStore";
import { Cart, Product } from "../types";

export function useCart() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const user = useAuthStore((s) => s.user);
  const isBuyer = user?.role === "buyer";
  const guestItems = useGuestCartStore((s) => s.items);
  const guestAdd = useGuestCartStore((s) => s.addItem);
  const guestUpdate = useGuestCartStore((s) => s.updateItem);
  const guestRemove = useGuestCartStore((s) => s.removeItem);

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.getOwnCart,
    enabled: isBuyer,
  });

  function onError(err: any) {
    push(err?.response?.data?.error?.message || "Something went wrong", "error");
  }

  function onSuccess(data: Cart) {
    queryClient.setQueryData(["cart"], data);
  }

  const addItem = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      selectedColor = "",
      product,
    }: {
      productId: string;
      quantity: number;
      selectedColor?: string;
      product?: Product;
    }) => {
      if (isBuyer) return cartApi.addItem(productId, quantity, selectedColor);
      if (product) guestAdd(product, quantity, selectedColor);
      return null;
    },
    onSuccess: (data) => {
      if (data) onSuccess(data);
      push("Added to cart", "success");
    },
    onError,
  });

  const updateItem = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const pendingGuestItem = guestItems.find((item) => item.id === itemId && item.cartId === "guest");
      if (pendingGuestItem) {
        guestUpdate(itemId, quantity);
        return null;
      }
      if (isBuyer) return cartApi.updateItem(itemId, quantity);
      guestUpdate(itemId, quantity); // guest itemId === productId
      return null;
    },
    onMutate: async ({ itemId, quantity }) => {
      if (!isBuyer) return undefined;

      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<Cart>(["cart"]);
      queryClient.setQueryData<Cart>(["cart"], (cart) =>
        cart
          ? {
              ...cart,
              items: cart.items.map((item) =>
                item.id === itemId
                  ? { ...item, quantity: Math.max(item.product.moq, Math.min(quantity, item.product.stock)) }
                  : item
              ),
            }
          : cart
      );
      return { previousCart };
    },
    onSuccess: (data) => data && onSuccess(data),
    onError: (err, _variables, context) => {
      if (context?.previousCart) queryClient.setQueryData(["cart"], context.previousCart);
      onError(err);
    },
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const pendingGuestItem = guestItems.find((item) => item.id === itemId && item.cartId === "guest");
      if (pendingGuestItem) {
        guestRemove(itemId);
        return null;
      }
      if (isBuyer) return cartApi.removeItem(itemId);
      guestRemove(itemId);
      return null;
    },
    onSuccess: (data) => {
      if (data) onSuccess(data);
      push("Removed from cart", "info");
    },
    onError,
  });

  // For guests there's no network round-trip — the query is always
  // "successful" with whatever's in local storage, so CartDrawer/CartPage
  // (which branch on cartQuery.isLoading/isError/isSuccess) render instantly.
  // If a server merge is rejected (for example, a product ran out of stock),
  // retain the guest lines visibly instead of making them appear lost. The
  // merge endpoint is transactional, so duplicates are impossible on success.
  const serverItems = cartQuery.data?.items ?? [];
  const pendingGuestItems = guestItems.filter((guest) => !serverItems.some((item) => item.productId === guest.productId && item.selectedColor === guest.selectedColor));
  const items = isBuyer ? [...serverItems, ...pendingGuestItems] : guestItems;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  const guestQueryShim = {
    data: guestCartAsCart(guestItems),
    isLoading: false,
    isError: false,
    isSuccess: true,
    refetch: () => {},
  } as unknown as typeof cartQuery;

  return {
    cart: isBuyer ? cartQuery.data : guestQueryShim.data,
    items,
    itemCount,
    subtotal,
    cartQuery: isBuyer ? cartQuery : guestQueryShim,
    addItem,
    updateItem,
    removeItem,
  };
}
