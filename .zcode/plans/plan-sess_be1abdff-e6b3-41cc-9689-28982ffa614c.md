## Plan: Account Refill Reminders + Settings pages (with functional cart)

Build two new working account pages and fix the broken cart along the way so the Refill Reminders "Reorder" action genuinely works. All new UI uses the **Tailwind + red-600 account aesthetic** (`bg-gray-50` page, `bg-white border border-gray-200 rounded-xl` cards, `bg-red-600` buttons) to match `account/page.tsx`.

### Part 1 — Fix the cart system (so "Reorder" is real)

**`src/components/CartContext.tsx`** — rewrite to hold real items instead of just a count:
- New `CartItem` type: `{ product: Medicine; quantity: number }`
- New `addToCart(product: Medicine, quantity?: number)` — merges by `product.id` (adds quantity if already in cart), preserves the existing bounce animation, and persists to `localStorage` so the cart survives reloads.
- New `removeFromCart(id)`, `updateQuantity(id, delta)`, `clearCart()`, and `items: CartItem[]`.
- Derive `count` from `items` (sum of quantities) so the header badge keeps working. Keep `isBouncing`.
- Load initial state from `localStorage` on mount; write on every change (guarded for SSR).

**`src/components/ProductCard.tsx`** (line 63) and **`src/components/AddToCartButton.tsx`** (line 18) — update the `addToCart(...)` call sites to pass the `product` object. `AddToCartButton` needs a new `product: Medicine` prop (and the `shop/[id]/page.tsx` call site will be updated to pass the page's product + quantity state).

**`src/app/cart/page.tsx`** — replace the empty local `useState` (line 15) with `useCart()` (`items`, `updateQuantity`, `removeFromCart`). The page's handlers already match the context API, so this is a small change. The order summary totals keep computing from items.

### Part 2 — Settings page (`src/app/account/settings/page.tsx`)

A self-contained page with the account sidebar replicated (same nav, with **Settings** highlighted and the other links linking to their real destinations), using only **existing** services — no new table needed.

- **Profile section**: loads via `getMyProfile()`, pre-fills full name + phone (email read-only), saves via `updateMyProfile()`. Success/error feedback banner. Uses the account page's loading/error/empty pattern.
- **Change password section**: current + new + confirm password fields (eye toggles), validated with `validatePassword`/`passwordsMatch` from `@/lib/auth-validation`, submitted via `useAuth().updatePassword()`. Mirrors `reset-password/page.tsx` logic.
- **Danger/sign-out**: a sign-out button calling `signOut()`.

### Part 3 — Refill Reminders page (`src/app/account/refill-reminders/page.tsx`)

Based on past orders (per your choice). Same sidebar with **Refill Reminders** highlighted.

- Loads `getOrdersByUser(userId)` and collects the unique set of `order_items` (keyed by `productId`) — these are the user's previously-ordered, refillable medications.
- For each, show name, last-ordered date, quantity, and price, with a **Reorder** button.
- **Reorder** resolves the full `Medicine` via `getMedicineById(productId)` (to get `imageUrl`, `brand`, etc. the cart needs), then calls `addToCart(product, quantity)` and navigates to `/cart`. If the product is no longer found / out of stock, show a disabled state with a tooltip.
- Standard loading / error / empty states ("No medications to refill yet — place your first order"), plus a "Browse products" CTA.

### Part 4 — Wire up the account sidebar (`src/app/account/page.tsx`, lines 119–131)

Update the dead `href="#"` links to real routes:
- `Order History` → `/account` (current page)
- `Refill Reminders` → `/account/refill-reminders`
- `Settings` → `/account/settings`
- (`Prescriptions` stays `/upload-prescription`)

### Files touched

| File | Change |
|---|---|
| `src/components/CartContext.tsx` | Rewrite: real items array + localStorage + CRUD API |
| `src/components/ProductCard.tsx` | Pass `product` to `addToCart` |
| `src/components/AddToCartButton.tsx` | Accept + pass `product` prop |
| `src/app/shop/[id]/page.tsx` | Pass `product` + `quantity` to `AddToCartButton` |
| `src/app/cart/page.tsx` | Consume `useCart()` instead of local state |
| `src/app/account/settings/page.tsx` | **New** — profile + password + sign-out |
| `src/app/account/refill-reminders/page.tsx` | **New** — reorder from past orders |
| `src/app/account/page.tsx` | Sidebar links → real routes |

### After building
Run `next build` to confirm zero type errors, then optionally verify the two pages in the browser.

No new database tables or migrations are required — Refill Reminders reads existing `orders`/`order_items`, and Settings uses existing `profiles` + auth.