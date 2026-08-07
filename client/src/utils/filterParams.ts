import { Filters } from "../components/product/FilterPanel";
import { SpecField } from "./productTaxonomy";

const SPEC_FIELDS: SpecField[] = ["composition", "weave", "finish", "material", "pattern", "sizeOrGauge"];

// Keeps the Filters shape (shared by the category-page FilterPanel sidebar
// and the discovery QuickFilterBar) round-trippable through the URL, so
// filters chosen on the category landing page survive navigate() into
// /discover, and refresh/back-forward/shareable links all behave.
// Only known filter keys are touched — unrelated params already on the URL
// (search, parentCategory) are left as-is when `base` is passed in.
export function serializeFiltersToParams(filters: Filters, base?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(base);
  const set = (key: string, value?: string) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };

  set("category", filters.categoryId);
  set("minPrice", filters.minPrice);
  set("maxPrice", filters.maxPrice);
  set("maxMoq", filters.maxMoq);
  set("inStock", filters.inStockOnly ? "1" : undefined);
  set("colors", filters.colors?.length ? filters.colors.join(",") : undefined);

  for (const field of SPEC_FIELDS) {
    const values = filters.specs?.[field];
    set(`spec_${field}`, values?.length ? values.join(",") : undefined);
  }

  return params;
}

export function parseFiltersFromParams(params: URLSearchParams): Filters {
  const filters: Filters = {};

  const category = params.get("category");
  if (category) filters.categoryId = category;

  const minPrice = params.get("minPrice");
  if (minPrice) filters.minPrice = minPrice;

  const maxPrice = params.get("maxPrice");
  if (maxPrice) filters.maxPrice = maxPrice;

  const maxMoq = params.get("maxMoq");
  if (maxMoq) filters.maxMoq = maxMoq;

  if (params.get("inStock") === "1") filters.inStockOnly = true;

  const colors = params.get("colors");
  if (colors) filters.colors = colors.split(",").filter(Boolean);

  const specs: Partial<Record<SpecField, string[]>> = {};
  for (const field of SPEC_FIELDS) {
    const raw = params.get(`spec_${field}`);
    if (raw) specs[field] = raw.split(",").filter(Boolean);
  }
  if (Object.keys(specs).length) filters.specs = specs;

  return filters;
}
