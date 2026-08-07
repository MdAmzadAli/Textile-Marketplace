import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listCategories } from "../../services/categories.api";
import { buildCategoryTree } from "../../utils/categoryTree";

// Persistent, one-click access to the top-level category groups — centered,
// the way Etsy/Flipkart present their primary nav categories under the main
// bar. Each link goes to that category's landing page (circular subcategory
// cards + trending), not straight to a flat product list.
export function CategoryStrip() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });
  const parents = buildCategoryTree(categories);

  if (!isLoading && parents.length === 0) return null;

  return (
    <div className="hidden md:block border-b border-border bg-surface">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6">
        <nav className="flex items-center justify-center gap-8 h-11 overflow-x-auto scrollbar-none" aria-label="Categories">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="h-3 w-24 rounded-sm bg-border animate-pulse shrink-0" />
              ))
            : parents.map((c) => (
                <Link
                  key={c.id}
                  to={`/category/${c.id}`}
                  className="text-sm text-text-primary hover:text-primary whitespace-nowrap transition-fast shrink-0 font-500"
                >
                  {c.name}
                </Link>
              ))}
        </nav>
      </div>
    </div>
  );
}
