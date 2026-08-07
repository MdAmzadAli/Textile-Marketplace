# Textile Marketplace — Maintainer Memory

Read this file first. It is an as-built map of the repository intended to let an AI or maintainer make a focused change with minimal further reading. Paths below are relative to the repository root.

## What this project is

This is a React/Express B2B textile marketplace. A person begins as a **buyer**, can browse and build a guest cart before login, and can later activate a supplier account mode. The core buyer loop is discovery → product detail → cart → saved address → order → order tracking. Suppliers maintain products and move their order lines through fulfillment statuses.

Implemented: account auth, buyer/supplier profiles and onboarding, public product discovery/filtering, image upload, cart and guest-cart merge, address book, checkout/orders, supplier inventory/dashboard/orders, responsive UI.

Not implemented: payment processing, admin UI, AI assistant, semantic/vector search, visual search. The database has vector fields only for future work. Product uploads are stored locally in `server/uploads` and exposed at `/uploads/*`; that is demo/local-development storage, not production object storage.

For detailed supplier requirements and UI intent, read **`seller_blueprint.md`**. Do not duplicate that long specification here.

## Fast start and verification

| Area | Directory | Command | Result |
| --- | --- | --- | --- |
| API development | `server` | `npm run dev` | Express at `http://localhost:4000` |
| Client development | `client` | `npm run dev` | Vite at `http://localhost:5173` |
| Client check | `client` | `npm run build` | TypeScript and production Vite build |
| Database setup | `server` | `npx prisma generate`, `npx prisma migrate dev`, `npx prisma db seed` | Generated client/schema/demo data |

Server configuration is described by `server/.env.example` and needs `DATABASE_URL`, `DIRECT_URL`, JWT secrets and `CLIENT_ORIGIN`. PostgreSQL must have `pgvector` available. API health check: `GET /api/health`.

## Architecture and where to start

| Need to change | Read first | Then read if behavior reaches server/state |
| --- | --- | --- |
| A page or route | `client/src/routes/router.tsx` and the page named by the route | Its `services/*.api.ts` client and relevant hook/store |
| Shared UI/look | `client/src/components/ui/index.ts`, `client/src/theme/tokens.ts`, `client/src/index.css` | The consuming page/component |
| Product discovery/detail | `features/buyer/discovery/*`, `features/buyer/product-details/ProductDetailsPage.tsx` | `services/products.api.ts`, `server/src/modules/products/*` |
| Cart/checkout | `hooks/useCart.ts`, `components/cart/CartItem.tsx`, `features/buyer/cart-checkout/*` | `store/guestCartStore.ts`, `server/src/modules/cart/*`, `modules/orders/*` |
| Auth/roles/account mode | `hooks/useAuth.ts`, `store/authStore.ts`, `services/api.ts` | `routes/RequireRole.tsx`, `RequireBuyerMode.tsx`, `server/src/modules/auth/*` |
| Buyer profile/addresses | `features/buyer/profile/*`, `features/buyer/onboarding/*` | respective service and server module |
| Supplier behavior | `seller_blueprint.md`, then `features/supplier/*` | supplier/order/product server modules |
| Database/data rule | `server/prisma/schema.prisma` | `server/prisma/seed.ts`, migrations, matching service |

Client: React 18, TypeScript, Vite, React Router, TanStack Query and Zustand. Server: Express, TypeScript, Prisma and PostgreSQL. Tailwind is configured in `client/tailwind.config.ts`; design tokens originate in `client/src/theme/tokens.ts` and `tokens.css`.

The only HTTP client is `client/src/services/api.ts`. It adds the Bearer access token, sends refresh cookies, deduplicates a 401 token-refresh request, retries the failed request once, and clears auth if refresh fails. Keep API calls out of presentation components: add them to `client/src/services`.

## Routes and access

`client/src/routes/router.tsx` is the complete client route table.

- Public buyer-mode routes: `/`, `/discover`, `/categories`, `/category/:id`, `/products/:id`, `/buyer/cart`.
- Auth pages: `/login`, `/register`.
- Buyer-only routes: onboarding, profile, addresses, checkout, orders and individual order detail under `/buyer/*`.
- Supplier-only routes: onboarding, dashboard, inventory, orders, profile and product preview under `/supplier/*`.
- `RequireRole` protects role-restricted pages. `RequireBuyerMode` keeps buyer-facing pages out of the supplier experience.

Client guards are UX only. API authorization is authoritative: `server/src/middleware/authGuard.ts` validates JWT access tokens and `roleGuard.ts` enforces roles. All body/query validation occurs with Zod in the module validation files via `requestValidator.ts`.

New registration deliberately accepts only the buyer role. Authenticated buyers can use `POST /api/auth/activate-seller` to enter supplier mode; `POST /api/auth/activate-buyer` returns to buyer mode. Do not reintroduce role choice during public registration without changing the server rule.

## Client state and important UX contracts

- `authStore.ts`: access token and user. `authModalStore.ts`: modal + redirect target. `toastStore.ts`: global feedback. `cartStore.ts`: drawer open/closed.
- `useAuth.ts` persists authenticated state and merges a guest cart after buyer login/registration. Preserve the merge sequence when changing auth or cart behavior.
- `guestCartStore.ts` persists guest lines in local storage. A guest item key is `productId:selectedColor`; authenticated cart lines are server records.
- `useCart.ts` selects the source based on current mode, combines unmerged guest lines with server lines so rejected merges remain visible, and owns add/update/remove mutations.
- Cart quantity updates use an optimistic React Query cache update for an authenticated buyer, so product line price, subtotal and count change immediately. The UI must **not** disable +/- solely because `updateItem.isPending`; remove actions still disable during removal.
- `CartItem.tsx` changes quantity by **5** with +/- (clamped to MOQ and stock), keeps its editable draft input synchronized from external cart changes, and computes the displayed line amount from `product.price * quantity`.
- Product cards and PDP must carry `selectedColor`; different colors are separate cart lines.

### PDP purchase controls

`features/buyer/product-details/ProductDetailsPage.tsx` owns gallery, color choice, MOQ input, similar products, and purchase actions.

- `Add to cart` and `Buy now` share the same mutation and disable while a request is pending, but only the button actually clicked displays a loader. The local `pendingPurchaseAction` state is the reason—do not replace both loaders with `addItem.isPending`.
- Buy now first adds the selected quantity. It then sends an authenticated buyer to checkout, or opens signup with `"/buyer/checkout"` as the redirect target.
- On mobile, the fixed purchase bar appears only when the original action row is outside the usable viewport (`IntersectionObserver`). Both desktop and fixed actions must stay behaviorally identical.

### Navigation and mobile layout

`components/layout/Navbar.tsx` combines desktop navigation with `MobileBottomNav.tsx`. On desktop Cart opens `CartDrawer`; the mobile buyer Cart entry goes directly to checkout, while a guest opens signup and returns to checkout after merge. Bottom navigation is fixed below the `md` breakpoint and `index.css` reserves its space.

Fixed mobile purchase/checkout bars use `calc(3.5rem + env(safe-area-inset-bottom))`. Pages that use them have bottom padding (`pb-36`). Maintain safe-area clearance and the observer behavior whenever changing mobile controls.

## Buyer flow in detail

### Discovery and products

- `BuyerDiscoveryPage.tsx`, `CategoryLandingPage.tsx`, `ProductCard.tsx`, `FilterPanel.tsx`, and `QuickFilterBar.tsx` implement browse/search/category/filter interactions.
- Product list query supports pagination, leaf or parent category, status, text search, supplier, price, color, stock-only, maximum MOQ, specs JSON, and sort (`newest`, price asc/desc, name). The contract is in `products.validation.ts`; mapping helpers are `utils/filterParams.ts` and `utils/productTaxonomy.ts`.
- `ProductDetailsPage.tsx` is public. A supplier can see it only through the protected supplier preview route.
- Active product creation requires `stock >= moq`; server validates this. Product status additionally controls purchase availability.

### Cart and checkout invariants

1. Guests can add/edit cart lines without login. Checkout is the point where account creation/login is required.
2. Every cart update must enforce `MOQ <= quantity <= stock`; both guest store and server clamp/validate this. Never treat client validation as security.
3. `POST /api/cart/items` adds its requested quantity to an existing same-product/same-color line. It does not replace it.
4. A cart line’s identity is `(cartId, productId, selectedColor)`—the `selectedColor` migration changed the earlier product-only uniqueness.
5. Checkout (`CheckoutPage.tsx`) requires a saved address, lets the buyer select/create/edit addresses, previews totals from draft quantities, commits input on blur/Enter, and can remove lines.
6. Checkout submits an address snapshot, not a live address reference. Its totals currently have zero fees and discounts.
7. The order service uses one database transaction: it validates nonempty cart, active stock and MOQ, snapshots price/color/shipping, decrements stock, creates order/items, then clears the cart. Do not split that transaction or calculate historic order prices from current product price.

## Supplier side — brief map

The complete seller requirements and decisions are in `seller_blueprint.md`. Implementation entry points are:

- `features/supplier/onboarding/SupplierOnboardingPage.tsx`: supplier business profile wizard.
- `features/supplier/inventory/SupplierInventoryPage.tsx` and `ProductFormModal.tsx`: own product list plus create/edit/delete and upload flow.
- `features/supplier/dashboard/SupplierDashboardPage.tsx`: metrics and trends; `components/dashboard/*` supplies tables, kanban and visual primitives.
- `features/supplier/orders/SupplierOrdersPage.tsx` and `SupplierOrderDetailDrawer.tsx`: supplier-scoped orders and status transition UI.
- `features/supplier/profile/SupplierAccountPage.tsx`: supplier account/profile.

Server support is `modules/supplier-profile`, `modules/products`, `modules/uploads`, and the supplier endpoints in `modules/orders`. Supplier order responses are intentionally scoped: they include only the seller’s lines plus `sellerTotal`; `hasOtherSuppliers` signals a mixed-seller order. Statuses are `pending → accepted → preparing → ready → completed`; use the server transition rule rather than trusting a displayed button.

## Server map

`server/src/app.ts` mounts every API and static uploads. Responses use `utils/apiResponse.ts`; errors use `AppError.ts`, `asyncHandler.ts`, and the final `middleware/errorHandler.ts`.

| Base endpoint | Access | Main behavior | Implementation |
| --- | --- | --- | --- |
| `/api/auth` | public except activation | register/login/refresh/logout; toggle account mode | `modules/auth/*` |
| `/api/users` | authenticated | current user, email/password change, deactivate | `modules/users/*` |
| `/api/categories` | public | category tree | `modules/categories/*` |
| `/api/products` | public read; supplier write | listing/trending/detail/own CRUD | `modules/products/*` |
| `/api/uploads` | supplier | multipart image upload, max 8 | `modules/uploads/*` |
| `/api/buyer-profile` | buyer | own profile | `modules/buyer-profile/*` |
| `/api/supplier-profile` | supplier | own profile | `modules/supplier-profile/*` |
| `/api/addresses` | buyer | address CRUD | `modules/addresses/*` |
| `/api/cart` | buyer | fetch/add/merge/update/delete | `modules/cart/*` |
| `/api/orders` | buyer/supplier by operation | place/list/detail, supplier stats/open count/status advance | `modules/orders/*` |

Controllers are deliberately thin; services own Prisma reads/writes and business rules. When changing a resource, update its validation → service → controller/route → client service → type/UI path coherently.

## Data model

The definitive schema is `server/prisma/schema.prisma`; use migrations rather than manually editing production tables.

- `User`: email/password hash, active flag, current `role`, plus supplier-mode flags/expiry.
- `BuyerProfile`: onboarding preferences, one `Cart`, addresses and orders.
- `SupplierProfile`: business details, MOQ, products.
- `Category`: self-referencing tree. `Product`: supplier/category, text/images/colors/specs, stock, decimal price, MOQ/unit/status/rating and unused vector fields.
- `Cart` has one buyer. `CartItem` has quantity and selected color; unique cart/product/color combination.
- `Address`: buyer-owned and cascade-deleted with buyer profile.
- `Order`: buyer, status, immutable `shippingInfo` JSON and items. `OrderItem`: product/supplier, selected color, quantity and immutable `priceAtOrder`.
- `ActivityLog` exists but has no current UI/API workflow.

## UI conventions

Use shared `components/ui` primitives whenever possible: `Button`, `Card`, `Input`, `Select`, `Textarea`, `Modal`, `Drawer`, `Popover`, `Accordion`, `Badge`, `Skeleton`, `EmptyState`, `Stepper`, and `Toast`. `Button` supports variants `primary|secondary|ghost|destructive`, size variants, loading state, and forwards refs.

Breakpoints are `sm=640`, `md=768`, `lg=1024`, `xl=1280`. Shared components/pages should expose loading, error, empty, and disabled states; mutations should use toasts or another clear failure path. Preserve theme tokens rather than introducing ad-hoc colors, type sizes or motion values.

## Repository notes

- `README.md` is setup-oriented and less complete than this guide.
- `seller_blueprint.md` is intentionally the detailed seller-side source.
- `reference.png` and the two files in `server/uploads` are visual/demo assets, not code contracts.
- `package-lock.json` files and `*.tsbuildinfo` are generated/dependency artifacts; do not hand-edit them.
- `server/prisma/migrations/*` records schema history, including product unit/rating/creation date, address/account lifecycle, seller account mode, and color selection changes.

## Safe change checklist

Before implementing a change, read the focused row in the architecture table, then verify:

- Client route/mode/role behavior for guests, buyers and suppliers.
- Corresponding client service, server validation, service rule, and Prisma model if the change crosses the API.
- Loading, error, empty, desktop and mobile states.
- MOQ, stock, selected color, guest merge and order transaction invariants for cart/order work.
- Mobile fixed controls do not cover the bottom navigation and retain safe-area offsets.
- `cd client && npm run build` passes after client changes; run server type/build and Prisma migration checks for server/schema changes.
