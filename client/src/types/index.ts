export type Role = "buyer" | "supplier" | "admin";
export type ProductStatus = "active" | "out_of_stock" | "inactive";
export type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "completed";

export interface User {
  id: string;
  email: string;
  role: Role;
  sellerEnabled?: boolean;
  createdAt: string;
}

export interface SupplierProfile {
  userId: string;
  businessName: string;
  businessType: string;
  contactInfo: string;
  address: string;
  operatingHours: string;
  categories: string[];
  fabricTypes: string[];
  moq: number;
  additionalInfo?: Record<string, unknown>;
}

export interface BuyerProfile {
  userId: string;
  businessType: string;
  industry: string;
  categoriesOfInterest: string[];
  fabricPreferences: string[];
  typicalOrderQty: number;
  budgetRange: string;
  additionalPrefs?: Record<string, unknown>;
  onboardingCompleted: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface Product {
  id: string;
  supplierId: string;
  name: string;
  categoryId: string;
  category?: Category;
  supplier?: { businessName: string; userId: string; contactInfo?: string };
  description: string;
  images: string[];
  colors: string[];
  specs?: Record<string, unknown>;
  stock: number;
  price: string | number;
  moq: number;
  unit: string;
  status: ProductStatus;
  rating?: number;
  ratingCount?: number;
  createdAt?: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  selectedColor: string;
  product: Product;
}

export interface Cart {
  id: string;
  buyerId: string;
  items: CartItem[];
}

export interface ShippingInfo {
  fullName: string;
  countryCode: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  notes?: string;
}

export interface Address extends ShippingInfo {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  supplierId: string;
  quantity: number;
  priceAtOrder: string | number;
  selectedColor: string;
  /** Seller-scoped endpoints provide this for each returned line. */
  lineTotal?: number;
}

export interface Order {
  id: string;
  buyerId: string;
  status: OrderStatus;
  shippingInfo: ShippingInfo;
  createdAt: string;
  items: OrderItem[];
  /** Seller-scoped subtotal, returned only by supplier order endpoints. */
  sellerTotal?: number;
  /** Present only on seller-scoped order endpoints; derived from the order-time shipping snapshot. */
  buyer?: { name: string | null; contact: { phone: string } | null };
  shippingAddress?: {
    addressLine: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    notes: string | null;
  };
  /** Detail endpoint only; no other supplier data accompanies this flag. */
  hasOtherSuppliers?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}
