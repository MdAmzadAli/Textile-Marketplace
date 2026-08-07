# Seller-side blueprint

This document describes the seller experience implemented in Textile Marketplace. It is the reference for seller-facing UI, navigation, permissions, product management, and order handling.

## 1. Seller account and mode

One person has one Textile Marketplace account. The account can be used in either active mode:

- **Buyer mode**: browse products, use a cart, manage addresses, and place orders.
- **Seller mode**: manage a supplier profile, listings, and orders.

The account uses one shared email and password. Seller account changes therefore also change the credentials used for buyer mode. This prevents duplicate accounts and makes account recovery reliable.

### Becoming a seller

1. A signed-in buyer opens **Account** in the desktop navbar, or opens **Buyer profile** on mobile.
2. The buyer clicks **Become a Seller**.
3. The application enables seller access and immediately navigates to `/supplier/onboarding`.
4. No second registration, duplicate email, or duplicate password is required.
5. Completing onboarding creates or updates the supplier profile and redirects to `/supplier/dashboard`.

### Seller access window

- Seller access is valid for 30 days from activation or confirmation.
- When seller access has expired, the account falls back to buyer mode at token refresh.
- Clicking **Switch to selling** opens a password-confirmation modal.
- The modal contains a password input and **Continue to seller setup** button.
- A correct password renews seller access for 30 days and takes the user to seller onboarding.
- Supplier API requests reject seller tokens whose seller-access expiry has passed.

### Switching to buying

- In the seller account dropdown, **Switch to buying** changes active mode to buyer and opens `/discover`.
- On the seller account page, **Switch to buying** performs the same action.
- If the account started as a seller and has no buyer profile, a blank buyer profile is created automatically.

## 2. Access boundaries

When the active mode is seller:

- `/`, `/discover`, `/categories`, `/category/:id`, `/products/:id`, and `/buyer/cart` redirect to `/supplier/dashboard`.
- Buyer-only protected routes also redirect away because their buyer role requirement is not met.
- The seller can open product previews only through `/supplier/products/:id/preview`.
- Seller endpoints require a supplier token; buyer endpoints require a buyer token.

This keeps Shop Manager focused and avoids exposing buyer navigation, cart state, or checkout controls while selling.

## 3. Seller navbar

All supplier pages render `SellerNavbar`, not the buyer navbar.

### Desktop and tablet controls

| Control | Destination / behaviour |
| --- | --- |
| **Shop Manager** logo | `/supplier/dashboard` |
| **Dashboard** | `/supplier/dashboard` |
| **Listings** | `/supplier/inventory` |
| **Orders** | `/supplier/orders` |
| **Account** | `/supplier/profile` |
| **Log out** | Clears the session and redirects to `/login` |

### Small-screen behaviour

- The full text navigation is hidden below the small breakpoint.
- Account and logout remain visible as icon controls.
- There is no buyer bottom navigation, buyer cart drawer, category strip, buyer search field, or buyer account dropdown in seller mode.
- Seller pages retain their horizontal dashboard sidebar links for direct section switching.

## 4. Seller routes

| Route | Purpose | Required mode |
| --- | --- | --- |
| `/supplier/onboarding` | Create or update supplier business details | Seller |
| `/supplier/dashboard` | Shop summary, stock alerts, and recent orders | Seller |
| `/supplier/inventory` | Manage all product listings | Seller |
| `/supplier/orders` | View and progress customer orders containing seller items | Seller |
| `/supplier/profile` | Seller account email, password, and mode switch | Seller |
| `/supplier/products/:id/preview` | View a listing using the buyer-facing product-detail component, without buyer actions | Seller |

## 5. Supplier onboarding

Onboarding is a four-step form with a visible stepper.

### Step 1 — Business Basics

Fields:

- Business name — required.
- Business type — required select.
- Contact info — required.

**Continue** validates this step before moving forward.

### Step 2 — Address & Hours

Fields:

- Address — required.
- Operating hours — required select.

### Step 3 — Categories & Fabrics

Fields:

- Categories supplied — at least one category must be selected.
- Fabric types offered — at least one selection is required.
- Supplier MOQ — required positive number.

### Step 4 — Review

- Displays all entered supplier data.
- **Back** returns to the previous step.
- **Finish setup** saves the supplier profile and opens the seller dashboard.

## 6. Seller dashboard

The dashboard is a compact “what needs attention” view.

### Summary cards

| Card | Source | Click action |
| --- | --- | --- |
| **Total products** | Count of the seller’s listings | Opens `/supplier/inventory` |
| **Low stock** | Active listings with 1–10 units of stock | Opens `/supplier/inventory` |
| **Out of stock** | `out_of_stock` status or zero stock | Opens `/supplier/inventory` |
| **Open orders** | Recently fetched orders not marked completed | Opens `/supplier/orders` |

### Recent orders

- Reads `GET /orders/supplier` instead of a placeholder state.
- Shows the shortened order ID, item count, seller-specific order value, and current status badge.
- Shows **No orders yet** only when the API returns no seller orders.

### Other dashboard sections

- **Orders trend** is intentionally a placeholder until actual analytics data exists.
- **Inventory alerts** lists low-stock product names and remaining stock.
- Listings and orders refresh every 30 seconds, and React Query also refetches on normal remount/focus behaviour.

## 7. Inventory / listings

Route: `/supplier/inventory`.

### Top controls

| Control | Behaviour |
| --- | --- |
| **Table view** icon | Shows `InventoryTable` for dense inventory management |
| **Card view** icon | Shows buyer-identical `ProductCard` listing previews |
| **Add product** | Opens the product form modal in create mode |

### Table view

Each product row displays listing, status, stock, price, and management controls supplied by `InventoryTable`.

- Quick stock/status updates call the product update endpoint.
- **Edit** opens the form modal with the product prefilled.
- **Delete** opens a confirmation modal; **Cancel** closes it and **Delete** permanently removes the listing.

### Card view

- Uses the same `ProductCard` component as buyer discovery, category, home, and similar-product sections.
- Listing image and title open `/supplier/products/:id/preview`.
- **Edit** opens the listing form.
- **Delete** opens the same confirmation modal.
- Supplier card actions replace buyer Add to Cart controls; sellers never see an Add to Cart button for their own listings.

### Product form modal

Required fields:

- Product name — at least 2 characters.
- Leaf category — required.
- Description — at least 10 characters.
- At least one uploaded image.
- Stock — whole number, zero or greater.
- Price — positive number with at most two decimal places.
- MOQ — whole number of at least 1.
- Unit — selected from the standard unit list.
- Status — Active, Out of stock, or Inactive.

Optional fields:

- Colors — type a color and click **Add** or press Enter; each chip has an **X** button to remove it.

Image controls:

- Drag files onto the upload area.
- Or click **browse** to select JPEG, PNG, or WebP files.
- Every uploaded image has an **X** button to remove it before saving.

Numeric-entry rules:

- Stock and MOQ accept digits only; browser number spinners are not used.
- Price accepts digits plus one decimal point and at most two decimal digits.
- Values are held as text while editing, so typing `20` remains `20` rather than being changed by browser step controls.
- An **Active** listing must have stock greater than or equal to its MOQ.
- The same rule is enforced by the server for both create and update requests.

Footer controls:

- **Cancel** closes the modal without saving.
- **Create product** creates a listing.
- **Save changes** updates an existing listing.
- A disabled submit button indicates required data is still missing.

## 8. Listing preview

Route: `/supplier/products/:id/preview`.

- Reuses `ProductDetailsPage`, which is the same product-detail component buyer-facing pages use.
- Displays product image gallery, supplier name, rating, price, stock status, description, colors, and MOQ.
- The seller navbar remains active.
- Add to Cart and the mobile purchase bar are not rendered for seller preview.
- Similar product links are not rendered in seller preview so a seller cannot accidentally leave Shop Manager for buyer discovery.

## 9. Orders

Route: `/supplier/orders`.

### Data scope

- `GET /orders/supplier` returns only orders containing at least one `OrderItem` whose `supplierId` equals the signed-in seller.
- The response includes only that seller’s items for each returned order.
- Seller-visible totals are calculated from those seller items, not from products belonging to other suppliers.

### Controls

| Control | Behaviour |
| --- | --- |
| Status select | Filters list view by order status |
| List icon | Shows compact order rows |
| Kanban icon | Groups orders into status columns |
| **Mark as {next status}** | Advances order status one allowed step |

Status order:

`pending → accepted → preparing → ready → completed`

- The next-status action is unavailable once an order is completed.
- Updates call `PATCH /orders/:id/status`.
- The server verifies that the seller owns at least one item in the order before accepting a status update.
- The page refreshes every 30 seconds and immediately invalidates supplier-order queries after an update.

## 10. Seller account

Route: `/supplier/profile`.

### Email card

- Shows the shared account email.
- **Save email** calls `PATCH /users/me/email`.
- The header updates immediately after success.

### Password card

- Requires current password and a new password of at least 8 characters.
- **Update password** calls `PATCH /users/me/password`.
- The server checks the current password before replacing the password hash.

### Buying mode card

- **Switch to buying** activates buyer mode and opens `/discover`.

## 11. Product availability and inventory after a sale

When a buyer places an order:

1. The order uses the product’s supplier ID to create each `OrderItem`.
2. Product stock is decremented inside the order transaction.
3. A product reaching zero stock becomes `out_of_stock`.
4. Supplier order queries immediately include the new order on their next fetch.
5. Supplier dashboard, Orders, and Inventory poll every 30 seconds, so purchases made from another session become visible without a new login.

Buyer catalog rules:

- Active products whose stock is below MOQ are hidden from ordinary catalog browsing.
- A matching Discovery keyword search can still show them as unavailable.
- Their Add to Cart control is disabled.

Mode-switch safeguard:

- An account cannot add or place an order for its own supplier listing. Both cart creation/merge and final order placement enforce this on the server.

## 12. Backend endpoints used by seller UI

| Endpoint | Method | Use |
| --- | --- | --- |
| `/auth/activate-seller` | POST | Enable or renew seller mode; password required after seller access expiry |
| `/auth/activate-buyer` | POST | Switch active mode to buyer and ensure buyer profile exists |
| `/supplier-profile/me` | GET | Read seller profile |
| `/supplier-profile/me` | PUT | Save seller onboarding/profile details |
| `/products/mine` | GET | List the current seller’s products |
| `/products` | POST | Create listing |
| `/products/:id` | PUT | Update owned listing |
| `/products/:id` | DELETE | Delete owned listing |
| `/orders/supplier` | GET | List orders containing current seller items |
| `/orders/:id/status` | PATCH | Advance order status for an owned order |
| `/users/me/email` | PATCH | Change shared account email |
| `/users/me/password` | PATCH | Change shared account password |

## 13. Current limitations and future work

- `Order.status` is currently global to the entire order. The database stores `supplierId` per order item, but it does not yet store independent shipment/status records per supplier. A multi-supplier order therefore needs a future fulfillment model (for example `SupplierFulfillment`) before each supplier can have completely independent tracking, shipping, and completion states.
- There are no supplier-specific messages, invoices, payout data, analytics, or shipment tracking fields yet, so the UI does not invent them.
- Dashboard “Orders trend” stays empty until an analytics endpoint is introduced.
- Cross-session updates use 30-second polling. WebSockets or server-sent events can replace polling when real-time notifications are needed.

## 14. Implementation rules for future seller work

- Keep seller pages inside `/supplier/*` and protected by supplier role checks.
- Do not add buyer navigation or buyer CTAs to seller pages.
- Reuse `ProductCard` and `ProductDetailsPage` for listing previews instead of duplicating product UI.
- Enforce business-critical checks on the server even when the form validates them on the client.
- Invalidate or refresh `products/mine` and `orders/supplier` after seller mutations.
- Preserve the one-account/two-mode model; do not create a second seller account for the same user without an explicit marketplace policy change.
