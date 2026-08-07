import { X } from "lucide-react";
import { Category } from "../../types";
import { Popover, Button, Input } from "../ui";
import { cn } from "../../utils/cn";
import { leafCategoryOptions } from "../../utils/categoryTree";
import { COLOR_PALETTE, COLOR_SWATCH_HEX, FACET_CONFIG, ProductKind } from "../../utils/productTaxonomy";
import { Filters } from "./FilterPanel";
import { useEffect, useState } from "react";

interface QuickFilterBarProps {
  /** Leaf categories in scope. Pass an empty array to hide the Category pill entirely. */
  categories: Category[];
  /** Drives which single spec facet (Composition / Material / Pattern) is offered. */
  kind: ProductKind;
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  showCategory?: boolean;
}

// Etsy-style horizontal filter bar: a handful of focused pill buttons above
// the product grid, each opening one small dropdown, rather than a
// permanently-visible sidebar or a second search box duplicating the navbar.
// Which pills appear adapts to context — the category pill hides once
// already scoped to one group, and the spec facet pill only shows the one
// attribute (Composition/Material/Pattern) that actually matters for that
// kind of product, so buyers are never shown irrelevant options.
export function QuickFilterBar({ categories, kind, filters, onChange, onReset, showCategory = true }: QuickFilterBarProps) {
  const categoryOptions = leafCategoryOptions(categories);
  // Only the single highest-priority facet for this kind (e.g. Composition
  // for fabrics) — the quick bar stays a handful of pills; the full ordered
  // facet list lives in the category-page FilterPanel sidebar instead.
  const facet = FACET_CONFIG[kind][0];
  const facetValues = (facet && filters.specs?.[facet.field]) || [];
  const selectedCategoryLabel = categoryOptions.find((o) => o.value === filters.categoryId)?.label;

  const [priceDraft, setPriceDraft] = useState({ min: filters.minPrice ?? "", max: filters.maxPrice ?? "" });
  // Keep the draft in sync when price is cleared/changed from outside this
  // popover (e.g. "Clear all"), so reopening it doesn't show stale values.
  useEffect(() => {
    setPriceDraft({ min: filters.minPrice ?? "", max: filters.maxPrice ?? "" });
  }, [filters.minPrice, filters.maxPrice]);

  const priceActive = Boolean(filters.minPrice || filters.maxPrice);
  const colorCount = filters.colors?.length ?? 0;
  const activeCount =
    (filters.categoryId ? 1 : 0) +
    (priceActive ? 1 : 0) +
    (colorCount > 0 ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (facetValues.length > 0 ? 1 : 0);

  function toggleFacetValue(value: string) {
    if (!facet) return;
    const next = facetValues.includes(value) ? facetValues.filter((v) => v !== value) : [...facetValues, value];
    onChange({ ...filters, specs: { ...filters.specs, [facet.field]: next.length ? next : undefined } });
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-visible pb-1 -mx-4 px-4 md:mx-0 md:px-0">
      {showCategory && categoryOptions.length > 0 && (
        <Popover label="Category" active={!!filters.categoryId} activeLabel={selectedCategoryLabel}>
          {(close) => (
            <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto">
              <FacetOption
                selected={!filters.categoryId}
                label="All categories"
                onClick={() => {
                  onChange({ ...filters, categoryId: undefined });
                  close();
                }}
              />
              {categoryOptions.map((o) => (
                <FacetOption
                  key={o.value}
                  selected={filters.categoryId === o.value}
                  label={o.label}
                  onClick={() => {
                    onChange({ ...filters, categoryId: o.value });
                    close();
                  }}
                />
              ))}
            </div>
          )}
        </Popover>
      )}

      <Popover
        label="Price"
        active={priceActive}
        activeLabel={priceActive ? `Price · ₹${filters.minPrice || 0}–${filters.maxPrice || "∞"}` : undefined}
      >
        {(close) => (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Min ₹"
                type="number"
                min={0}
                value={priceDraft.min}
                onChange={(e) => setPriceDraft((d) => ({ ...d, min: e.target.value }))}
              />
              <Input
                label="Max ₹"
                type="number"
                min={0}
                value={priceDraft.max}
                onChange={(e) => setPriceDraft((d) => ({ ...d, max: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              {priceActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setPriceDraft({ min: "", max: "" });
                    onChange({ ...filters, minPrice: undefined, maxPrice: undefined });
                    close();
                  }}
                >
                  Clear
                </Button>
              )}
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  onChange({
                    ...filters,
                    minPrice: priceDraft.min || undefined,
                    maxPrice: priceDraft.max || undefined,
                  });
                  close();
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </Popover>

      <Popover
        label="Color"
        active={colorCount > 0}
        activeLabel={colorCount > 0 ? `Color · ${colorCount}` : undefined}
        panelClassName="w-72"
      >
        {(close) => (
          <div>
            <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto">
              {COLOR_PALETTE.map((c) => {
                const selected = filters.colors?.includes(c) ?? false;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      const next = new Set(filters.colors ?? []);
                      if (selected) next.delete(c);
                      else next.add(c);
                      onChange({ ...filters, colors: next.size ? Array.from(next) : undefined });
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-1.5 rounded-sm text-[10px] leading-tight text-center transition-fast",
                      selected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-bg"
                    )}
                    title={c}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-border shrink-0"
                      style={{ background: COLOR_SWATCH_HEX[c] ?? "#ccc" }}
                      aria-hidden
                    />
                    <span className="line-clamp-2 text-text-primary">{c}</span>
                  </button>
                );
              })}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={close}>
              Done
            </Button>
          </div>
        )}
      </Popover>

      {facet && (
        <Popover
          label={facet.label}
          active={facetValues.length > 0}
          activeLabel={
            facetValues.length ? `${facet.label} · ${facetValues.length > 1 ? facetValues.length : facetValues[0]}` : undefined
          }
        >
          {(close) => (
            <div>
              <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
                {facet.options.map((opt) => (
                  <FacetOption key={opt} selected={facetValues.includes(opt)} label={opt} onClick={() => toggleFacetValue(opt)} />
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-2" onClick={close}>
                Done
              </Button>
            </div>
          )}
        </Popover>
      )}

      <button
        type="button"
        onClick={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
        aria-pressed={!!filters.inStockOnly}
        className={cn(
          "inline-flex items-center h-9 px-3.5 rounded-full border text-sm whitespace-nowrap transition-fast shrink-0",
          filters.inStockOnly
            ? "border-primary bg-primary/5 text-primary font-500"
            : "border-border bg-surface text-text-primary hover:border-primary/50"
        )}
      >
        In stock only
      </button>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setPriceDraft({ min: "", max: "" });
            onReset();
          }}
          className="inline-flex items-center gap-1 h-9 px-3 rounded-full text-sm text-text-muted hover:text-error transition-fast shrink-0"
        >
          <X className="h-3.5 w-3.5" aria-hidden /> Clear all
        </button>
      )}
    </div>
  );
}

function FacetOption({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left px-2.5 py-1.5 rounded-sm text-sm transition-fast",
        selected ? "bg-primary/10 text-primary font-500" : "hover:bg-bg text-text-primary"
      )}
    >
      {label}
    </button>
  );
}
