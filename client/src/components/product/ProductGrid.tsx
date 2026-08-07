import { PackageSearch } from "lucide-react";
import { Product } from "../../types";
import { ProductCard } from "./ProductCard";
import { Skeleton, EmptyState, Button } from "../ui";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  matchScores?: Record<string, number>; // productId -> score, for visual search
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ProductGrid({
  products,
  isLoading,
  isError,
  onRetry,
  matchScores,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your filters or search terms.",
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="Couldn't load products"
        description="Check your connection and try again."
        action={onRetry && <Button size="sm" onClick={onRetry}>Retry</Button>}
      />
    );
  }

  if (products.length === 0) {
    return <EmptyState icon={PackageSearch} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} matchScore={matchScores?.[product.id]} />
      ))}
    </div>
  );
}
