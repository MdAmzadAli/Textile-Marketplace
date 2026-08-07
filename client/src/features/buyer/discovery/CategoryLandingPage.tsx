import { useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import { Navbar } from "../../../components/layout/Navbar";
import { Footer } from "../../../components/layout/Footer";
import { PageContainer } from "../../../components/layout/PageContainer";
import { FilterPanel, Filters } from "../../../components/product/FilterPanel";
import { ProductGrid } from "../../../components/product/ProductGrid";
import { Button, Drawer, EmptyState } from "../../../components/ui";
import { listCategories } from "../../../services/categories.api";
import { listTrendingProducts, listProducts } from "../../../services/products.api";
import { buildCategoryTree } from "../../../utils/categoryTree";
import { getKindForParentSlug } from "../../../utils/productTaxonomy";
import { serializeFiltersToParams } from "../../../utils/filterParams";

// This page serves two distinct intents with one component:
//
// 1. Navbar entry (/category/:id) — the user already knows the group they
//    want ("Trims & Notions"); subcategories render as circular cards, the
//    familiar Etsy-style category-hub pattern.
// 2. "View all" from a homepage rail (/categories) — the user was looking
//    at trending/new items with no category in mind yet; they land on an
//    overview of every top-level category as rectangular cards (a
//    deliberately different shape so the two contexts never look
//    interchangeable), with the same trending/new items they came from
//    mixed in underneath, category context restored either way.
export default function CategoryLandingPage() {
  const { id } = useParams<{ id: string }>();
  const isRoot = !id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focus = searchParams.get("focus") === "new" ? "new" : "trending";
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({});

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const category = isRoot ? undefined : categories.find((c) => c.id === id);
  const children = isRoot ? [] : categories.filter((c) => c.parentId === id);
  const topLevelCategories = buildCategoryTree(categories);
  const kind = getKindForParentSlug(category?.slug);

  const trendingQuery = useQuery({
    queryKey: ["products", "trending", isRoot ? "root" : "parent", id],
    queryFn: () => listTrendingProducts(12, isRoot ? {} : { parentCategoryId: id }),
    enabled: isRoot || !!id,
  });

  const newArrivalsQuery = useQuery({
    queryKey: ["products", "new-arrivals", "root"],
    queryFn: () => listProducts({ status: "active", limit: 12, sort: "newest" }),
    enabled: isRoot && focus === "new",
  });

  const mixedQuery = focus === "new" ? newArrivalsQuery : trendingQuery;
  const mixedItems = focus === "new" ? newArrivalsQuery.data?.items : trendingQuery.data;

  function applyFiltersAndGo() {
    setFiltersOpen(false);
    // Carries every sidebar selection — price, MOQ, spec facets, colors,
    // in-stock — into the discovery page URL, not just the category, so
    // nothing the buyer picked here is silently dropped on navigation.
    const params = serializeFiltersToParams(filters);
    if (!filters.categoryId && id) params.set("parentCategory", id);
    navigate(`/discover?${params.toString()}`);
  }

  if (!isRoot && !categoriesLoading && !category) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <Navbar />
        <PageContainer className="flex-1">
          <EmptyState
            title="Category not found"
            description="This category may have been removed or renamed."
            action={<Button onClick={() => navigate("/discover")}>Browse all fabrics</Button>}
          />
        </PageContainer>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      {/* Header band — image-backed so this never reads as a bare text page */}
      <section className="bg-primary">
        <PageContainer className="py-6 md:py-8 text-center">
          <nav className="flex items-center justify-center gap-1.5 text-xs text-white/70 mb-2">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{isRoot ? "Explore categories" : category?.name ?? "Category"}</span>
          </nav>
          <h1 className="font-display text-3xl md:text-4xl text-white">
            {isRoot ? "Explore categories" : category?.name ?? "Loading..."}
          </h1>
          <p className="text-white/80 mt-2 max-w-xl mx-auto">
            {isRoot
              ? "Every category on the marketplace, in one place — pick a starting point, or browse what's moving below."
              : `Browse every ${category?.name.toLowerCase()} subcategory, sourced directly from verified suppliers.`}
          </p>
        </PageContainer>
      </section>

      <PageContainer className="py-10">
        {isRoot ? (
          <>
            {/* Root overview — rectangular cards, intentionally distinct from the
                circular subcategory cards below so "explore everything" never
                looks like "I already know what I want" (navbar path). */}
            <h2 className="font-display text-xl text-text-primary mb-4">Shop by category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {(categoriesLoading ? Array.from({ length: 4 }) : topLevelCategories).map((c: any, i) => (
                <Link
                  key={c?.id ?? i}
                  to={c ? `/category/${c.id}` : "#"}
                  className={`relative aspect-[4/3] rounded-md overflow-hidden group bg-border ${!c ? "animate-pulse pointer-events-none" : ""}`}
                >
                  {c && (
                    <>
                      <img
                        src={`https://picsum.photos/seed/cat-root-${c.slug ?? i}/500/375`}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-fast group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-text-primary/75 via-text-primary/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                        <span className="font-display text-white text-sm md:text-base text-balance">{c.name}</span>
                        <p className="text-white/75 text-xs mt-0.5">{c.children.length} subcategories</p>
                      </div>
                    </>
                  )}
                </Link>
              ))}
            </div>

            {/* Mixed trending/new items — restores the context the user came
                from (homepage rail) instead of dropping them into an unfiltered grid. */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {focus === "new" ? (
                  <Sparkles className="h-5 w-5 text-accent" aria-hidden />
                ) : (
                  <TrendingUp className="h-5 w-5 text-accent" aria-hidden />
                )}
                <h2 className="font-display text-xl text-text-primary">
                  {focus === "new" ? "New arrivals, across every category" : "Trending, across every category"}
                </h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/discover")}>
                Browse everything
              </Button>
            </div>

            <ProductGrid
              products={mixedItems ?? []}
              isLoading={mixedQuery.isLoading}
              isError={mixedQuery.isError}
              onRetry={() => mixedQuery.refetch()}
              emptyTitle={focus === "new" ? "No new items yet" : "Nothing trending yet"}
              emptyDescription="Check back soon, or browse the full catalog."
            />
          </>
        ) : (
          <>
            {/* Subcategories as circular cards — the primary way in, per Etsy's hub pattern */}
            <h2 className="font-display text-xl text-text-primary mb-4">Shop {category?.name}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 mb-12">
              {children.map((child, i) => (
                <Link
                  key={child.id}
                  to={`/discover?category=${child.id}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <span className="h-20 w-20 md:h-28 md:w-28 rounded-full overflow-hidden bg-bg border border-border group-hover:border-primary transition-fast">
                    <img
                      src={`https://picsum.photos/seed/cat-${child.slug ?? i}/300/300`}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                  <span className="text-xs md:text-sm text-text-primary text-center line-clamp-2">{child.name}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center mb-4">
              <Button variant="secondary" size="sm" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </Button>
            </div>

            <ProductGrid
              products={trendingQuery.data ?? []}
              isLoading={trendingQuery.isLoading}
              isError={trendingQuery.isError}
              onRetry={() => trendingQuery.refetch()}
              emptyTitle="Nothing trending here yet"
              emptyDescription="Once buyers start ordering, best-sellers in this category will show up here."
            />
          </>
        )}
      </PageContainer>

      {!isRoot && (
        <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" side="left" footer={<Button className="w-full" onClick={applyFiltersAndGo}>Show results</Button>}>
          <FilterPanel
            categories={children}
            kind={kind}
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters({})}
          />
        </Drawer>
      )}

      <Footer />
    </div>
  );
}
