// Centralized choice lists for onboarding (and anywhere else that needs them).
// Per the design system rule (§4/§5 of the blueprint): a decision field is a
// dropdown driven from one place, never a free-text input duplicated per form.

export const SUPPLIER_BUSINESS_TYPES = [
  "Manufacturer",
  "Wholesaler",
  "Mill / Weaver",
  "Exporter",
  "Trading Company",
  "Dyeing & Processing Unit",
  "Other",
];

export const BUYER_BUSINESS_TYPES = [
  "Manufacturer",
  "Retailer",
  "Wholesaler",
  "Exporter",
  "Trading Company",
  "Boutique / Designer Label",
  "E-commerce Brand",
  "Other",
];

export const INDUSTRIES = [
  "Fashion Apparel",
  "Home Textiles",
  "Institutional & Uniforms",
  "Upholstery & Furnishing",
  "Automotive Textiles",
  "Technical & Industrial Textiles",
  "Fashion Accessories",
  "Other",
];

export const OPERATING_HOURS = [
  "Mon–Sat, 9am–6pm",
  "Mon–Fri, 9am–6pm",
  "Mon–Sun, 9am–9pm",
  "24/7",
  "Mon–Sat, 10am–7pm",
];

export const BUDGET_RANGES = [
  "Under ₹50,000",
  "₹50,000–₹2,00,000",
  "₹2,00,000–₹10,00,000",
  "Above ₹10,00,000",
];

export const FABRIC_TYPES = ["Cotton", "Silk", "Linen", "Wool", "Denim", "Polyester", "Rayon", "Blends"];

export const TYPICAL_ORDER_QUANTITIES = [
  { label: "Under 100 units", value: "50" },
  { label: "100–250 units", value: "250" },
  { label: "250–500 units", value: "500" },
  { label: "500–1,000 units", value: "1000" },
  { label: "1,000–5,000 units", value: "5000" },
  { label: "5,000+ units", value: "10000" },
];

export const MOQ_OPTIONS = [10, 25, 50, 100, 150, 200, 300, 500];

// Trims, notions and embellishments aren't sold by the meter the way fabric
// is — this list backs both the supplier product form and price/unit display.
export const UNIT_OPTIONS = ["meter", "yard", "piece", "pack", "spool", "roll", "set"];
