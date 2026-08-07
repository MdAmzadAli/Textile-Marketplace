import { createBrowserRouter } from "react-router-dom";
import HomePage from "./HomePage";
import { RequireRole } from "./RequireRole";
import { RequireBuyerMode } from "./RequireBuyerMode";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import SupplierOnboardingPage from "../features/supplier/onboarding/SupplierOnboardingPage";
import SupplierDashboardPage from "../features/supplier/dashboard/SupplierDashboardPage";
import SupplierInventoryPage from "../features/supplier/inventory/SupplierInventoryPage";
import SupplierOrdersPage from "../features/supplier/orders/SupplierOrdersPage";
import SupplierAccountPage from "../features/supplier/profile/SupplierAccountPage";
import BuyerOnboardingPage from "../features/buyer/onboarding/BuyerOnboardingPage";
import BuyerDiscoveryPage from "../features/buyer/discovery/BuyerDiscoveryPage";
import CategoryLandingPage from "../features/buyer/discovery/CategoryLandingPage";
import ProductDetailsPage from "../features/buyer/product-details/ProductDetailsPage";
import CartPage from "../features/buyer/cart-checkout/CartPage";
import CheckoutPage from "../features/buyer/cart-checkout/CheckoutPage";
import BuyerProfilePage from "../features/buyer/profile/BuyerProfilePage";
import BuyerAddressesPage from "../features/buyer/profile/BuyerAddressesPage";
import BuyerOrdersPage from "../features/buyer/dashboard/BuyerOrdersPage";
import BuyerOrderDetailPage from "../features/buyer/dashboard/BuyerOrderDetailPage";

export const router = createBrowserRouter([
  { element: <RequireBuyerMode />, children: [
  { path: "/", element: <HomePage /> },

  // Public discovery + PDP + cart — browsing AND adding to cart both work
  // without login (traditional flow, §4). Only checkout requires an account.
  { path: "/discover", element: <BuyerDiscoveryPage /> },
  { path: "/categories", element: <CategoryLandingPage /> },
  { path: "/category/:id", element: <CategoryLandingPage /> },
  { path: "/products/:id", element: <ProductDetailsPage /> },
  { path: "/buyer/cart", element: <CartPage /> },
  ] },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  {
    element: <RequireRole roles={["supplier"]} />,
    children: [
      { path: "/supplier/onboarding", element: <SupplierOnboardingPage /> },
      { path: "/supplier/dashboard", element: <SupplierDashboardPage /> },
      { path: "/supplier/inventory", element: <SupplierInventoryPage /> },
      { path: "/supplier/orders", element: <SupplierOrdersPage /> },
      { path: "/supplier/profile", element: <SupplierAccountPage /> },
      { path: "/supplier/products/:id/preview", element: <ProductDetailsPage /> },
    ],
  },

  {
    element: <RequireRole roles={["buyer"]} />,
    children: [
      { path: "/buyer/onboarding", element: <BuyerOnboardingPage /> },
      { path: "/buyer/profile", element: <BuyerProfilePage /> },
      { path: "/buyer/addresses", element: <BuyerAddressesPage /> },
      { path: "/buyer/checkout", element: <CheckoutPage /> },
      { path: "/buyer/orders", element: <BuyerOrdersPage /> },
      { path: "/buyer/orders/:id", element: <BuyerOrderDetailPage /> },
    ],
  },
]);
