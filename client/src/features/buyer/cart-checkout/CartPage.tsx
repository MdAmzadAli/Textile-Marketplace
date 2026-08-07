import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Navbar } from "../../../components/layout/Navbar";
import { PageContainer } from "../../../components/layout/PageContainer";
import { CartItem } from "../../../components/cart/CartItem";
import { OrderSummary } from "../../../components/cart/OrderSummary";
import { Card, Skeleton, EmptyState, Button } from "../../../components/ui";
import { useCart } from "../../../hooks/useCart";
import { useAuth } from "../../../hooks/useAuth";
import { useAuthModalStore } from "../../../store/authModalStore";

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const openAuthModal = useAuthModalStore((s) => s.open);
  const { items, itemCount, subtotal, cartQuery, updateItem, removeItem } = useCart();

  // Same rule as the drawer: cart is always yours to view/edit, checkout is
  // the one moment an account is required. Guest cart data survives the
  // signup/login (merged automatically, see useAuth).
  function handleCheckout() {
    if (isAuthenticated) {
      navigate("/buyer/checkout");
    } else {
      openAuthModal("signup", "/buyer/checkout");
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <PageContainer className="max-w-4xl">
        <h1 className="font-display text-3xl mb-6">Your cart</h1>

        {cartQuery.isLoading && <Skeleton variant="row" count={4} />}

        {cartQuery.isError && (
          <EmptyState
            title="Couldn't load your cart"
            description="Check your connection and try again."
            action={<Button onClick={() => cartQuery.refetch()}>Retry</Button>}
          />
        )}

        {cartQuery.isSuccess && items.length === 0 && (
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Browse the catalog to find fabrics for your business."
            action={<Button onClick={() => navigate("/discover")}>Start browsing</Button>}
          />
        )}

        {cartQuery.isSuccess && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 items-start">
            <Card>
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={(itemId, quantity) => updateItem.mutate({ itemId, quantity })}
                  onRemove={(itemId) => removeItem.mutate(itemId)}
                  disabled={removeItem.isPending}
                />
              ))}
            </Card>

            <Card>
              <OrderSummary
                subtotal={subtotal}
                itemCount={itemCount}
                action={
                  <Button className="w-full" onClick={handleCheckout}>
                    Proceed to checkout
                  </Button>
                }
              />
            </Card>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
