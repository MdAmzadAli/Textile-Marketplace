import { Category } from "../../types";
import { Select, Input, Button, AccordionSection } from "../ui";
import { cn } from "../../utils/cn";
import { leafCategoryOptions } from "../../utils/categoryTree";
import {
  COLOR_PALETTE,
  COLOR_SWATCH_HEX,
  FACET_CONFIG,
  MOQ_BANDS,
  ProductKind,
  SpecField,
} from "../../utils/productTaxonomy";

export interface Filters {
  categoryId?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  colors?: string[];
  inStockOnly?: boolean;
  // Several facets can be active at once (e.g. Composition AND Weave), and
  // each facet itself is multi-select (e.g. Composition = Cotton OR Silk).
  specs?: Partial<Record<SpecField, string[]>>;
  maxMoq?: string;
}

interface FilterPanelProps {
  categories: Category[];
  /** Drives which spec facets (Composition/Weave/Finish, etc.) this sidebar offers, and in what order. */
  kind: ProductKind;
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

// Importance-ordered accordion sidebar for the category landing page.
// Order reflects what a B2B textile buyer actually decides on, in sequence,
// not an alphabetical or schema-driven list:
//   1. In stock — a binary dealbreaker, so it sits outside the accordion
//      entirely and applies with a single tap.
//   2. Category — narrows everything below it.
//   3. Price — a near-universal budget constraint, cheap to reason about,
//      open by default.
//   4. Max order quantity — arguably the highest-leverage B2B-specific
//      filter: without it, a small buyer can match on every other facet and
//      still hit a dead end at the supplier's MOQ.
//   5+. Spec facets, in the kind's priority order from productTaxonomy.ts
//      (e.g. Composition before Weave before Finish for fabrics).
//   Last. Color — usually decided last, since many buyers accept custom
//      dyeing/matching once the material spec is right.
export function FilterPanel({ categories, kind, filters, onChange, onReset }: FilterPanelProps) {
  const categoryOptions = leafCategoryOptions(categories);
  const facets = FACET_CONFIG[kind];
  const specCount = Object.values(filters.specs ?? {}).filter((v) => v && v.length).length;
  const colorCount = filters.colors?.length ?? 0;

  const hasActiveFilters = Boolean(
    filters.categoryId ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.maxMoq ||
      filters.inStockOnly ||
      colorCount > 0 ||
      specCount > 0
  );

  function toggleSpecValue(field: SpecField, value: string) {
    const current = filters.specs?.[field] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    const specs = { ...filters.specs, [field]: next.length ? next : undefined };
    onChange({ ...filters, specs });
  }

  function toggleColor(color: string) {
    const current = filters.colors ?? [];
    const next = current.includes(color) ? current.filter((c) => c !== color) : [...current, color];
    onChange({ ...filters, colors: next.length ? next : undefined });
  }

  return (
    <div className="flex flex-col">
      {/* In stock — instant, no accordion, since it's a dealbreaker not a preference */}
      <button
        type="button"
        onClick={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
        aria-pressed={!!filters.inStockOnly}
        className={cn(
          "flex items-center justify-between h-10 px-3 mb-2 rounded-sm border text-sm transition-fast",
          filters.inStockOnly
            ? "border-primary bg-primary/5 text-primary font-500"
            : "border-border bg-surface text-text-primary hover:border-primary/50"
        )}
      >
        In stock only
        <span
          className={cn(
            "h-4 w-4 rounded-sm border flex items-center justify-center shrink-0",
            filters.inStockOnly ? "bg-primary border-primary" : "border-border"
          )}
          aria-hidden
        >
          {filters.inStockOnly && <span className="h-2 w-2 rounded-[1px] bg-white" />}
        </span>
      </button>

      <AccordionSection title="Category" defaultOpen>
        <Select
          placeholder="All categories"
          value={filters.categoryId ?? ""}
          options={categoryOptions}
          onChange={(e) => onChange({ ...filters, categoryId: e.target.value || undefined })}
        />
      </AccordionSection>

      <AccordionSection title="Price" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Min ₹"
            type="number"
            min={0}
            value={filters.minPrice ?? ""}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value || undefined })}
          />
          <Input
            label="Max ₹"
            type="number"
            min={0}
            value={filters.maxPrice ?? ""}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value || undefined })}
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Max order quantity" badge={filters.maxMoq ? "1" : undefined}>
        <div className="flex flex-col gap-0.5">
          <FacetRow
            selected={!filters.maxMoq}
            label="Any MOQ"
            onClick={() => onChange({ ...filters, maxMoq: undefined })}
          />
          {MOQ_BANDS.map((band) => (
            <FacetRow
              key={band.value}
              selected={filters.maxMoq === band.value}
              label={band.label}
              onClick={() => onChange({ ...filters, maxMoq: band.value })}
            />
          ))}
        </div>
      </AccordionSection>

      {facets.map((facet) => {
        const selectedValues = filters.specs?.[facet.field] ?? [];
        return (
          <AccordionSection
            key={facet.field}
            title={facet.label}
            badge={selectedValues.length ? String(selectedValues.length) : undefined}
          >
            <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
              {facet.options.map((opt) => (
                <CheckboxRow
                  key={opt}
                  checked={selectedValues.includes(opt)}
                  label={opt}
                  onClick={() => toggleSpecValue(facet.field, opt)}
                />
              ))}
            </div>
          </AccordionSection>
        );
      })}

      <AccordionSection title="Color" badge={colorCount ? String(colorCount) : undefined}>
        <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto">
          {COLOR_PALETTE.map((c) => {
            const selected = filters.colors?.includes(c) ?? false;
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleColor(c)}
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
      </AccordionSection>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={onReset}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

function FacetRow({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
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

function CheckboxRow({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className="flex items-center gap-2 text-left px-2.5 py-1.5 rounded-sm text-sm transition-fast hover:bg-bg text-text-primary"
    >
      <span
        className={cn(
          "h-4 w-4 rounded-sm border flex items-center justify-center shrink-0",
          checked ? "bg-primary border-primary" : "border-border"
        )}
        aria-hidden
      >
        {checked && <span className="h-2 w-2 rounded-[1px] bg-white" />}
      </span>
      {label}
    </button>
  );
}
