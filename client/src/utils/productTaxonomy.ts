// The marketplace has exactly 4 fixed parent categories (server/prisma/seed.ts
// CATEGORY_TREE) and that taxonomy doesn't change at runtime, so the
// discovery quick-filter bar derives each leaf category's "kind" from its
// parent slug instead of adding a new schema column just for UI facet
// selection. If the parent taxonomy in seed.ts ever changes, update the
// mapping below to match.
export type ProductKind = "fabric" | "notion" | "embellishment" | "mixed";

const PARENT_SLUG_TO_KIND: Record<string, Exclude<ProductKind, "mixed">> = {
  "raw-finished-fabrics": "fabric",
  "linings-interfacings": "fabric",
  "trims-notions": "notion",
  embellishments: "embellishment",
};

export function getKindForParentSlug(slug?: string): ProductKind {
  if (!slug) return "mixed";
  return PARENT_SLUG_TO_KIND[slug] ?? "mixed";
}

export type SpecField = "composition" | "weave" | "finish" | "material" | "pattern" | "sizeOrGauge";

export interface FacetConfig {
  field: SpecField;
  label: string;
  options: string[];
}

// Ordered spec facet list per kind — index 0 is the single most
// decision-critical attribute for that kind of buyer, and is the only one
// the compact discovery QuickFilterBar surfaces (one "which variant"
// dropdown, never more, on top of the universal category/price/color/
// in-stock pills). The category-page FilterPanel sidebar has room to show
// the full list, in the same priority order, as separate accordion
// sections. Options mirror the enumerated lists in seed.ts exactly, since
// specs values are drawn from those same lists.
//
// Ordering rationale (buyer decision order, not alphabetical):
// - fabric: Composition is the make-or-break technical spec (what it's
//   made of); Weave is the construction/hand-feel, usually a close second;
//   Finish is a secondary refinement most buyers filter on last, if at all.
// - notion: Material is the primary spec trims/notions are chosen by;
//   Size/Gauge narrows it further once material is settled.
// - embellishment: buyers browse embellishments by look first, so Pattern
//   leads; Material and Size/Gauge follow as fit/finish refinements.
export const FACET_CONFIG: Record<ProductKind, FacetConfig[]> = {
  fabric: [
    {
      field: "composition",
      label: "Composition",
      options: [
        "100% Cotton",
        "65% Polyester / 35% Cotton",
        "100% Silk",
        "80% Wool / 20% Nylon",
        "100% Linen",
        "95% Cotton / 5% Elastane",
      ],
    },
    {
      field: "weave",
      label: "Weave",
      options: ["Plain Weave", "Twill", "Satin", "Herringbone", "Basket Weave", "Jacquard", "Rib Knit", "Interlock Knit"],
    },
    {
      field: "finish",
      label: "Finish",
      options: ["Mercerized", "Enzyme Washed", "Peach Finish", "Calendered", "Sanforized", "Brushed", "Raw / Unfinished"],
    },
  ],
  notion: [
    {
      field: "material",
      label: "Material",
      options: ["Polyester", "Nylon", "Brass", "Plastic", "Cotton", "Metal Alloy", "Acrylic"],
    },
    {
      field: "sizeOrGauge",
      label: "Size / Gauge",
      options: ["Small", "Medium", "Large", "Standard", "3mm", "5mm", "10mm", "20mm"],
    },
  ],
  embellishment: [
    {
      field: "pattern",
      label: "Pattern",
      options: ["Floral", "Geometric", "Solid", "Metallic", "Beaded", "Embroidered"],
    },
    {
      field: "material",
      label: "Material",
      options: ["Polyester", "Nylon", "Brass", "Plastic", "Cotton", "Metal Alloy", "Acrylic"],
    },
    {
      field: "sizeOrGauge",
      label: "Size / Gauge",
      options: ["Small", "Medium", "Large", "Standard", "3mm", "5mm", "10mm", "20mm"],
    },
  ],
  mixed: [],
};

export interface MoqBand {
  label: string;
  value: string;
}

// Mirrors the MOQ values seed.ts actually assigns (fabrics up to 200,
// notions/embellishments up to 100), rounded to buyer-friendly ceilings —
// a B2B buyer filters by "MOQs I can commit to," not a precise unit count.
// This is arguably the single highest-leverage filter for a small/first-time
// buyer: without it, every other match in the results can still be a dead
// end once they see the supplier's minimum order quantity.
export const MOQ_BANDS: MoqBand[] = [
  { label: "Up to 25 units", value: "25" },
  { label: "Up to 50 units", value: "50" },
  { label: "Up to 100 units", value: "100" },
  { label: "Up to 200 units", value: "200" },
];

// Mirrors seed.ts COLOR_PALETTE — the full set of colors any product can
// carry, offered as swatches in the Color quick-filter.
export const COLOR_PALETTE = [
  "Ivory", "Charcoal", "Indigo", "Terracotta", "Olive", "Mustard", "Maroon",
  "Sage Green", "Navy", "Blush Pink", "Slate Grey", "Rust", "Cream", "Black",
  "Off White", "Teal", "Burgundy", "Camel", "Gold", "Silver",
];

// Approximate display hex per named color, for the swatch circles — cosmetic
// only, never sent to the server (filtering happens by name).
export const COLOR_SWATCH_HEX: Record<string, string> = {
  Ivory: "#F6F0E4",
  Charcoal: "#36454F",
  Indigo: "#3B3A6E",
  Terracotta: "#C05C3B",
  Olive: "#708238",
  Mustard: "#D8A31A",
  Maroon: "#6E2C2C",
  "Sage Green": "#9CAF88",
  Navy: "#1B2A4A",
  "Blush Pink": "#E8B4B8",
  "Slate Grey": "#6E7B8B",
  Rust: "#A0522D",
  Cream: "#F5EEDC",
  Black: "#1A1A1A",
  "Off White": "#F1EDE4",
  Teal: "#227C7C",
  Burgundy: "#6D2130",
  Camel: "#C19A6B",
  Gold: "#C9A227",
  Silver: "#B8B8B8",
};
