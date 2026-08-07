export const ROLES = ["buyer", "supplier", "admin"] as const;
export type RoleType = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
] as const;

export const PRODUCT_STATUSES = ["active", "out_of_stock", "inactive"] as const;
