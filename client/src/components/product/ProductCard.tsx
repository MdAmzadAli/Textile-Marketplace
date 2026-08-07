import { Link, useNavigate } from "react-router-dom";
import { Check, ShoppingBag, Star } from "lucide-react";
import { Card, Button } from "../ui";
import { StockBadge } from "./StockBadge";
import { formatCurrency } from "../../utils/formatCurrency";
import { Product } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

interface ProductCardProps {
  product: Product;
  matchScore?: number; // visual search "X% match" badge
  actions?: React.ReactNode; // e.g. quick-edit buttons in supplier inventory
  productLink?: string;
}

export function ProductCard({ product, matchScore, actions, productLink = `/products/${product.id}` }: ProductCardProps) {
  const { user } = useAuth();
  const { addItem, items } = useCart();
  const navigate = useNavigate();
  const alreadyInCart = items.some((item) => item.productId === product.id);
  const isBelowMoq = product.stock < product.moq;
  // Quick-add works for guests too (add-to-cart never requires an account —
  // signup is only asked for at checkout). Supplier inventory passes its own
  // `actions` (quick-edit), which takes priority so affordances never collide,
  // and a supplier browsing their own storefront shouldn't see a buyer CTA.
  const canAddToCart = !actions && user?.role !== "supplier" && product.status === "active" && !isBelowMoq;
  const needsColorSelection = product.colors.length > 0;
  const showUnavailableCta = !actions && user?.role !== "supplier" && isBelowMoq;

  return (
    <Card className="flex flex-col p-0 overflow-hidden group">
      <Link to={productLink} className="relative block aspect-square bg-bg overflow-hidden">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-fast group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-text-muted text-sm">
            No image
          </div>
        )}
        {matchScore !== undefined && (
          <span className="absolute top-2 left-2 bg-accent text-white text-xs px-2 py-1 rounded-sm">
            {Math.round(matchScore * 100)}% match
          </span>
        )}
      </Link>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <Link to={productLink} className="font-500 text-text-primary line-clamp-1 hover:text-primary">
          {product.name}
        </Link>
        {product.supplier && (
          <p className="text-xs text-text-muted line-clamp-1">{product.supplier.businessName}</p>
        )}
        <RatingStars rating={product.rating} count={product.ratingCount} />
        <div className="flex items-center justify-between mt-1">
          <span className="font-display text-lg text-text-primary">
            {formatCurrency(product.price)}
            <span className="text-xs font-body text-text-muted"> / {product.unit}</span>
          </span>
          {isBelowMoq ? <span className="text-xs font-500 text-error">Currently unavailable</span> : <StockBadge status={product.status} stock={product.stock} />}
        </div>
        <p className="text-xs text-text-muted">MOQ: {product.moq} {product.unit}{product.moq === 1 ? "" : "s"}</p>
        {actions && <div className="flex gap-2 pt-2 border-t border-border">{actions}</div>}
        {canAddToCart && (
          <Button
            size="sm"
            variant={alreadyInCart ? "secondary" : "primary"}
            className={alreadyInCart ? "w-full mt-2 border-success bg-success/10 text-success hover:bg-success/20" : "w-full mt-2"}
            loading={addItem.isPending}
            onClick={() => needsColorSelection ? navigate(productLink) : addItem.mutate({ productId: product.id, quantity: product.moq, product })}
          >
            {alreadyInCart ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            {alreadyInCart ? "Added to cart" : "Add to cart"}
          </Button>
        )}
        {showUnavailableCta && <Button size="sm" className="w-full mt-2" disabled><ShoppingBag className="h-4 w-4" />Add to cart</Button>}
      </div>
    </Card>
  );
}

// Warm-amber fill reads as "rating" at a glance without competing with the
// accent color reserved for price/CTA moments (see design tokens, §5).
function RatingStars({ rating, count }: { rating?: number; count?: number }) {
  if (!rating || !count) {
    return <span className="text-xs text-text-muted">No ratings yet</span>;
  }
  return (
    <div className="flex items-center gap-1" aria-label={`${rating.toFixed(1)} out of 5 stars, ${count} ratings`}>
      <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />
      <span className="text-xs font-500 text-text-primary">{rating.toFixed(1)}</span>
      <span className="text-xs text-text-muted">({count})</span>
    </div>
  );
}
