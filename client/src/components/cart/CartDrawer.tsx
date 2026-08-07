import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Drawer, Button, Skeleton, EmptyState } from "../ui";
import { CartItem } from "./CartItem";
import { OrderSummary } from "./OrderSummary";
import { useCart } from "../../hooks/useCart";
import { useCartStore } from "../../store/cartStore";
import { useAuth } from "../../hooks/useAuth";
import { useAuthModalStore } from "../../store/authModalStore";

export function CartDrawer() {
  const { isDrawerOpen, closeDrawer } = useCartStore();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const openAuthModal = useAuthModalStore((s) => s.open);
  const { items, itemCount, subtotal, cartQuery, updateItem, removeItem } = useCart();

  // Cart itself never requires an account — only the step where money and
  // shipping details are collected does. A guest here gets the signup
  // modal (cart data is preserved and merged automatically, see useAuth).
  function handleCheckout() {
    closeDrawer();
    if (isAuthenticated) {
      navigate("/buyer/checkout");
    } else {
      openAuthModal("signup", "/buyer/checkout");
    }
  }

  return (
    <Drawer open={isDrawerOpen} onClose={closeDrawer} title="Your cart">
      {cartQuery.isLoading && <Skeleton variant="row" count={3} />}

      {cartQuery.isError && (
        <EmptyState
          title="Couldn't load your cart"
          description="Check your connection and try again."
          action={<Button size="sm" onClick={() => cartQuery.refetch()}>Retry</Button>}
        />
      )}

      {cartQuery.isSuccess && items.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the catalog to find fabrics for your business."
          action={
            <Button size="sm" onClick={() => { closeDrawer(); navigate("/discover"); }}>
              Start browsing
            </Button>
          }
        />
      )}

      {cartQuery.isSuccess && items.length > 0 && (
        <div className="flex flex-col">
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={(itemId, quantity) => updateItem.mutate({ itemId, quantity })}
              onRemove={(itemId) => removeItem.mutate(itemId)}
              disabled={removeItem.isPending}
            />
          ))}
        </div>
      )}

      {cartQuery.isSuccess && items.length > 0 && (
        <div className="mt-4">
          <OrderSummary
            subtotal={subtotal}
            itemCount={itemCount}
            action={
              <Button className="w-full" onClick={handleCheckout}>
                Proceed to checkout
              </Button>
            }
          />
        </div>
      )}
    </Drawer>
  );
}
