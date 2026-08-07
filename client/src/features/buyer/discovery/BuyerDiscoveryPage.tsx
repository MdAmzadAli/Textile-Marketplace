import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "../../../components/layout/Navbar";
import { PageContainer } from "../../../components/layout/PageContainer";
import { QuickFilterBar } from "../../../components/product/QuickFilterBar";
import { FilterPanel, Filters } from "../../../components/product/FilterPanel";
import { ProductGrid } from "../../../components/product/ProductGrid";
import { Button, Drawer } from "../../../components/ui";
import { SlidersHorizontal } from "lucide-react";
import { listCategories } from "../../../services/categories.api";
import { listProducts, ListProductsParams } from "../../../services/products.api";
import { getKindForParentSlug } from "../../../utils/productTaxonomy";
import { parseFiltersFromParams, serializeFiltersToParams } from "../../../utils/filterParams";

export default function BuyerDiscoveryPage() {
  // Deep-links from the navbar search bar, category strip and category
  // landing page (/discover?search=...&category=...&parentCategory=...) land
  // pre-filtered here — one search pipeline, not a separate page per entry point.
  // Keyword search itself is read straight from the URL rather than mirrored
  // into local state: the navbar's SearchBar is the single search input for
  // the whole app (see task 1), so this page never shows a second one —
  // searching again from the navbar just updates this same query.
  const [urlParams, setUrlParams] = useSearchParams();
  const search = urlParams.get("search") ?? undefined;
  // Hydrates every filter — category, price, MOQ, spec facets, colors,
  // in-stock — from the URL on load, so filters picked on the category
  // landing page sidebar (which navigate()s here) actually carry over,
  // instead of only the category surviving the jump.
  const [filters, setFiltersState] = useState<Filters>(() => parseFiltersFromParams(urlParams));
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Keeps the URL in sync as filters change here too, so refresh/back-
  // forward/shared links keep working — without touching unrelated params
  // already on the URL (search, parentCategory).
  function setFilters(next: Filters) {
    setFiltersState(next);
    setUrlParams(serializeFiltersToParams(next, urlParams), { replace: true });
  }

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });

  // "Inside a particular item category" scoping (task 4): the URL's
  // parentCategory (arriving from a category landing page) takes priority;
  // otherwise, once a specific leaf is selected — via the URL or by picking
  // one from the Category quick-filter itself — its parent group is used.
  // This is what drives both the sibling-category list in the Category pill
  // and which single spec facet (Composition/Material/Pattern) applies.
  const effectiveCategoryId = filters.categoryId ?? urlParams.get("category") ?? undefined;
  const currentLeaf = categories.find((c) => c.id === effectiveCategoryId);
  const effectiveParentId = urlParams.get("parentCategory") ?? currentLeaf?.parentId ?? undefined;
  const scopedParent = categories.find((c) => c.id === effectiveParentId);
  const filterCategories = scopedParent ? categories.filter((c) => c.parentId === scopedParent.id) : categories;
  const kind = getKindForParentSlug(scopedParent?.slug);

  const productsQuery = useQuery({
    queryKey: ["products", "discover", search, filters, effectiveParentId],
    queryFn: () =>
      listProducts({
        search,
        categoryId: filters.categoryId,
        parentCategoryId: filters.categoryId ? undefined : effectiveParentId,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        maxMoq: filters.maxMoq ? Number(filters.maxMoq) : undefined,
        colors: filters.colors,
        inStockOnly: filters.inStockOnly,
        specs: filters.specs,
        status: "active",
        sort: "name",
        limit: 24,
      }),
  });

  const total = productsQuery.data?.pagination.total;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <PageContainer>
        <div className="text-center py-3 md:py-4">
          <h1 className="font-display text-3xl mb-1">{scopedParent ? scopedParent.name : "Discover fabrics"}</h1>
          <p className="text-text-muted">{scopedParent ? `Browse every ${scopedParent.name.toLowerCase()} item from every supplier.` : "Browse the full catalog from every supplier."}</p>
        </div>

        {/* Quick-filter bar — pill buttons above the grid, each opening a
            single focused dropdown. Replaces the old permanently-visible
            sidebar (and the redundant local search box) so filtering never
            costs more than a click or two, on any screen size. */}
        <div className="mb-5">
          <div className="flex items-center gap-2 overflow-x-auto">
          <QuickFilterBar
            categories={filterCategories}
            kind={kind}
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters({})}
            showCategory={false}
          />
          <Button variant="secondary" size="sm" className="shrink-0" onClick={() => setFiltersOpen(true)}><SlidersHorizontal className="h-4 w-4" /> Filters</Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-sm text-text-muted">
            {productsQuery.isLoading ? "Searching..." : `${total ?? 0} result${total === 1 ? "" : "s"}`}
          </p>
        </div>

        <ProductGrid
          products={productsQuery.data?.items ?? []}
          isLoading={productsQuery.isLoading}
          isError={productsQuery.isError}
          onRetry={() => productsQuery.refetch()}
          emptyTitle="No fabrics match your search"
          emptyDescription="Try a different search term or clear your filters."
        />
        <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Advanced filters" side="left" footer={<Button className="w-full" onClick={() => setFiltersOpen(false)}>Show results</Button>}>
          <FilterPanel categories={filterCategories} kind={kind} filters={filters} onChange={setFilters} onReset={() => setFilters({})} />
        </Drawer>
      </PageContainer>
    </div>
  );
}
