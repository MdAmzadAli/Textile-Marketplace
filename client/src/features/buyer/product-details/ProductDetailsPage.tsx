import { useEffect, useRef, useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "../../../components/layout/Navbar";
import { PageContainer } from "../../../components/layout/PageContainer";
import { ProductGrid } from "../../../components/product/ProductGrid";
import { StockBadge } from "../../../components/product/StockBadge";
import { Button, Skeleton, EmptyState, Input } from "../../../components/ui";
import { formatCurrency } from "../../../utils/formatCurrency";
import { getProduct, listProducts } from "../../../services/products.api";
import { useCart } from "../../../hooks/useCart";
import { useAuth } from "../../../hooks/useAuth";
import { useAuthModalStore } from "../../../store/authModalStore";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const openAuthModal = useAuthModalStore((s) => s.open);
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [pendingPurchaseAction, setPendingPurchaseAction] = useState<"cart" | "buy" | null>(null);
  const purchaseActionRef = useRef<HTMLDivElement>(null);
  const [purchaseActionVisible, setPurchaseActionVisible] = useState(true);

  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  const product = productQuery.data;
  useEffect(() => { if (product) { setQuantity(product.moq); setSelectedColor(product.colors[0] ?? ""); } }, [product?.id, product?.moq]);

  useEffect(() => {
    const target = purchaseActionRef.current;
    if (!target) return;

    // The lower part of the viewport is occupied by the fixed action bar and
    // bottom navigation. The original action only counts as visible once it
    // reaches the remaining usable part of the screen.
    const observer = new IntersectionObserver(
      ([entry]) => setPurchaseActionVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -136px 0px", threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [product?.id]);

  const similarQuery = useQuery({
    queryKey: ["products", "similar", product?.categoryId],
    queryFn: () => listProducts({ categoryId: product!.categoryId, status: "active", limit: 4 }),
    enabled: !!product,
  });

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <Navbar />
        <PageContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton variant="card" />
            <div className="flex flex-col gap-3">
              <Skeleton count={4} />
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <Navbar />
        <PageContainer>
          <EmptyState
            title="Product not found"
            description="It may have been removed or is no longer available."
          />
        </PageContainer>
      </div>
    );
  }

  const isBuyer = !user || user.role === "buyer";
  const isSellerPreview = user?.role === "supplier";
  const outOfStock = product.status !== "active" || product.stock === 0;
  const needsColor = product.colors.length > 0 && !selectedColor;
  const similarProducts = (similarQuery.data?.items ?? []).filter((p) => p.id !== product.id);
  const showMobilePurchaseBar = isBuyer && !purchaseActionVisible;
  const addToCart = async () => {
    setPendingPurchaseAction("cart");
    try {
      await addItem.mutateAsync({ productId: product.id, quantity, product, selectedColor });
    } catch {
      // useCart already presents the API/local-cart error to the buyer.
    } finally {
      setPendingPurchaseAction(null);
    }
  };
  const buyNow = async () => {
    setPendingPurchaseAction("buy");
    try {
      await addItem.mutateAsync({ productId: product.id, quantity, product, selectedColor });
      if (isAuthenticated) navigate("/buyer/checkout");
      else openAuthModal("signup", "/buyer/checkout");
    } catch {
      // useCart already presents the API/local-cart error to the buyer.
    } finally {
      setPendingPurchaseAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-36 md:pb-0">
      <Navbar />
      <PageContainer>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-surface border border-border rounded-md overflow-hidden mb-3">
              {product.images[activeImage] ? (
                <img
                  src={product.images[activeImage]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-text-muted">
                  No image
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-16 rounded-sm overflow-hidden border-2 transition-fast ${
                      i === activeImage ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="font-display text-3xl text-text-primary">{product.name}</h1>
              {product.supplier && (
                <p className="text-sm text-text-muted mt-1">Sold by {product.supplier.businessName}</p>
              )}
            </div>

            {product.rating && product.ratingCount ? <div className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-warning text-warning" /><span className="font-500">{product.rating.toFixed(1)}</span><span className="text-text-muted">({product.ratingCount} ratings)</span></div> : <p className="text-sm text-text-muted">New listing — no ratings yet</p>}

            <div className="flex items-center gap-3">
              <span className="font-display text-2xl text-text-primary">
                {formatCurrency(product.price)}
                <span className="text-sm font-body text-text-muted"> / {product.unit}</span>
              </span>
              <StockBadge status={product.status} stock={product.stock} />
            </div>

            <p className="text-text-primary">{product.description}</p>

            {product.colors.length > 0 && <div><p className="mb-2 text-sm font-500">Choose a color</p><div className="flex flex-wrap gap-2">{product.colors.map((color) => <button key={color} type="button" onClick={() => setSelectedColor(color)} className={`rounded-sm border px-3 py-2 text-sm ${selectedColor === color ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-bg"}`}>{color}</button>)}</div>{needsColor && <p className="mt-2 text-xs text-text-muted">Select a color before adding this product.</p>}</div>}

            <p className="text-sm text-text-muted">
              Minimum order quantity: {product.moq} {product.unit}
              {product.moq === 1 ? "" : "s"}
            </p>

            {isBuyer && (
              <div ref={purchaseActionRef} className="flex items-center gap-2 mt-2 flex-nowrap">
                <Input
                  type="number"
                  min={product.moq}
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(product.stock, Math.max(product.moq, Number(e.target.value) || product.moq)))}
                  className="w-20 md:w-24 shrink-0"
                  disabled={outOfStock}
                />
                <Button
                  className="h-10 px-3 shrink-0"
                  disabled={outOfStock || needsColor || addItem.isPending}
                  loading={pendingPurchaseAction === "cart"}
                  onClick={addToCart}
                >
                  {outOfStock ? "Out of stock" : <><ShoppingCart className="h-4 w-4 md:hidden" aria-hidden /><span className="hidden md:inline">Add to cart</span></>}
                </Button>
                <Button className="h-10 px-3 shrink-0" variant="secondary" disabled={outOfStock || needsColor || addItem.isPending} loading={pendingPurchaseAction === "buy"} onClick={buyNow}>Buy now</Button>
              </div>
            )}
          </div>
        </div>

        {!isSellerPreview && similarProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl mb-4">Similar products</h2>
            <ProductGrid products={similarProducts} />
          </div>
        )}
      </PageContainer>
      <div className={`fixed inset-x-0 z-[45] border-t border-border bg-surface p-3 shadow-modal transition-all duration-200 ease-out md:hidden ${showMobilePurchaseBar ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`} style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom))" }}><div className="mx-auto flex max-w-lg items-center gap-2"><Input aria-label="Quantity" type="number" min={product.moq} max={product.stock} value={quantity} onChange={(e) => setQuantity(Math.min(product.stock, Math.max(product.moq, Number(e.target.value) || product.moq)))} className="w-20 shrink-0" disabled={outOfStock} /><Button aria-label="Add to cart" className="h-10 px-3 shrink-0" disabled={outOfStock || needsColor || addItem.isPending} loading={pendingPurchaseAction === "cart"} onClick={addToCart}>{outOfStock ? "Out of stock" : <ShoppingCart className="h-4 w-4" aria-hidden />}</Button><Button className="ml-auto h-10 px-3 shrink-0" variant="secondary" disabled={outOfStock || needsColor || addItem.isPending} loading={pendingPurchaseAction === "buy"} onClick={buyNow}>Buy now</Button></div></div>
    </div>
  );
}
