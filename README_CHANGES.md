# What changed

Only these 6 files were touched. Nothing else in the project was modified.

1. `src/db/schema.ts` — added `isFeatured` boolean column to the `categories` table.
2. `src/db/settings.ts` — added `announcement_enabled` and `announcement_message` to the site settings type + defaults.
3. `src/app/admin/actions.ts` — `saveCategoryAction` now saves `isFeatured`; added `toggleCategoryFeaturedAction` for the quick star toggle.
4. `src/app/page.tsx` — Featured Products section now includes products whose CATEGORY is marked featured (not just individually-featured products); added the glowing red announcement banner at the top of the homepage.
5. `src/app/globals.css` — added the `.announcement-glow-text` glow animation.
6. `src/components/AdminPanel.tsx` — Categories tab: each category card now has a "Mark Featured / Unmark Featured" button + badge, and the category modal has a matching checkbox. Settings tab: new "Homepage Announcement Banner" section (enable toggle + message box + live preview).

# How to apply

1. Copy these 6 files into your project at the same paths, overwriting the existing ones.
2. Run the database migration so Postgres gets the new `is_featured` column on `categories`:
   ```powershell
   npm run db:push
   ```
   (Answer "yes" / accept when it asks to add the column — it's additive, nothing is deleted.)
3. Restart `npm run dev` and check:
   - Admin > Categories: each category has a "Mark Featured" button.
   - Admin > Settings: bottom of the form has "Homepage Announcement Banner".
   - Homepage: marking a category updates the "Featured Products" section instantly (after refresh); the announcement banner glows red at the very top once enabled with a message.

# How it works

- Marking a category "Featured" sets `categories.is_featured = true`. The homepage Featured Products query now selects any product where EITHER the product itself is featured OR its category is featured, so unmarking instantly removes all its products again — no per-product editing needed.
- The announcement message is stored as a normal site setting (same mechanism as your existing hero text / phone numbers), so no new table was needed. Leaving the message blank or unchecking "Enable" hides the banner completely.

---

# Update: Homepage Featured Categories + Image Viewer Navigation

Only these 5 files were touched. Nothing else in the project was modified.

1. `src/db/schema.ts` — added `showOnHomepage` (boolean) and `homepageOrder` (integer) columns to the `categories` table.
2. `src/app/admin/actions.ts` — `saveCategoryAction` now saves `showOnHomepage`; added `toggleCategoryHomepageAction` (quick show/hide) and `reorderHomepageCategoriesAction` (persists the ↑/↓ order).
3. `src/components/AdminPanel.tsx` — Categories tab: each category card now has an "Add to Homepage / On Homepage" button, a homepage position badge (`#1 ON HOMEPAGE`, etc.), and ↑/↓ buttons to reorder featured categories; the category modal has a matching "Show on Homepage" checkbox.
4. `src/app/page.tsx` — new "Featured Categories" section, placed immediately after the hero banner (before any other content), that renders each admin-selected category — in the exact order set in Admin — with up to 8 of its products and a "View All" button linking to the full category page. Auto-hidden until at least one category is configured.
5. `src/components/ProductGallery.tsx` — the product image lightbox now supports: left/right arrow-key navigation (desktop), swipe-to-navigate (mobile/touch), an image counter ("2 / 5"), and Escape to close. Looping through images (last → first, first → last) and the existing click-arrow navigation were already in place and are unchanged.

## How to apply

1. Copy these 5 files into your project at the same paths, overwriting the existing ones.
2. Run the database migration so Postgres gets the new `show_on_homepage` and `homepage_order` columns on `categories`:
   ```powershell
   npm run db:push
   ```
   (Answer "yes" / accept when it asks to add the columns — it's additive, nothing is deleted. Note: a migration file for these exact columns, `drizzle/0004_add_category_homepage_fields.sql`, was already present in the project from an earlier attempt — `db:push` will simply confirm the columns already match, or add them if they don't exist yet.)
3. Restart `npm run dev` and check:
   - Admin > Categories: each category card has an "Add to Homepage" button; once added, ↑/↓ arrows appear to reorder it.
   - Homepage: as soon as one or more categories are added, a new section appears directly under the hero banner (no more empty gap), showing that category's products with a "View All" button. Reordering in Admin instantly changes the section order on refresh.
   - Product page: open any product with multiple images, click to zoom, then use the ← / → keys (or on-screen arrows) to move between images — it loops continuously until you close it (X or Esc). On mobile, swipe left/right inside the zoomed view.

## How it works

- "Show on Homepage" is a separate flag from "Featured" (the existing star toggle). "Featured" still controls the homepage's *Featured Products* section (individual products). "Show on Homepage" controls the new, separate *Featured Categories* section — a full category block with its own heading, products, and "View All" link.
- Order is stored as a plain integer (`homepage_order`) per category. The ↑/↓ buttons swap a category's position with its neighbor and save the whole new order in one call, so there's always a single source of truth and no drag-and-drop library was needed.
- The homepage only fetches up to 8 products per featured category (newest first) — visitors always land on real products immediately after the hero, and "View All" takes them to the full, unfiltered category page for everything else.

---

# Update 2: Hero Banner On/Off Toggle

Only these 3 files were touched. Nothing else in the project was modified.

1. `src/db/settings.ts` — added a `hero_enabled` site setting (defaults to `'true'`).
2. `src/app/page.tsx` — the entire Hero section (the big blue "Your One-Stop Online Wholesale Store" banner, "How It Works" card, and stats row) is now wrapped so it only renders when `hero_enabled !== 'false'`.
3. `src/components/AdminPanel.tsx` — Settings tab: new "Homepage Hero Banner" section with a "Show Hero Banner" checkbox, right above the existing Announcement Banner section.

## How it works

- Turn **off** "Show Hero Banner" in Admin → Settings and the hero disappears completely. Whatever is enabled just below it — the black announcement banner (if turned on) and then the Featured Categories section — moves straight up, so products/categories start right at the top of the page.
- Turn it back **on** any time to restore the hero exactly as it was; nothing about its design or content changes.
- This does not affect the announcement banner, which is a separate toggle and unaffected by this change.

---

# Update 3: "Back to Catalog" preserves scroll position

Only these 2 files were touched (1 new, 1 edited). Nothing else in the project was modified.

1. **`src/components/BackToCatalogButton.tsx`** (new) — a small client component that renders exactly like the old "Back to Catalog" link, but when the visitor actually arrived from the catalog listing page (`/products`, including any category/filter/sort in the URL), clicking it triggers the browser's native **back** action instead of a fresh navigation.
2. **`src/app/products/[slug]/page.tsx`** — swapped the old `<Link href="/products">Back to Catalog</Link>` for `<BackToCatalogButton />`.

## How to apply

1. Copy `src/components/BackToCatalogButton.tsx` into your project (new file).
2. Copy `src/app/products/[slug]/page.tsx` over your existing one.
3. No database change, no `npm run db:push` needed — restart `npm run dev` and test:
   - Go to a category (e.g. Products → Locks & Security), scroll down partway into the grid, click into any product's details, then click "Back to Catalog". You should land back exactly where you were — same row and column, same category filter — not the top of the full catalog.
   - Works the same way on mobile browsers (swipe-back or tapping the button) since it relies on the browser's own history/scroll restoration, not custom scroll math.
   - If you open a product page directly (e.g. a shared WhatsApp link, or a fresh tab with no prior page), "Back to Catalog" still works — it just takes you to that product's category page normally, since there's no previous scroll position to restore.

## How it works

- Browsers (and Next.js's App Router) already restore scroll position automatically on true "back" navigation (browser back button, swipe-back gesture) — the problem was that "Back to Catalog" was a forward link to a brand-new `/products` page, not an actual "back" action, so it always reset to the top and dropped the category/filter you had selected.
- The new button checks `document.referrer`: if the visitor came from `/products` (the catalog listing, with whatever category/sort/search was active), it calls the router's `back()` instead — a true history-back action, so the exact scroll position and filters are restored for free. Any other case (direct link, new tab, a different origin) falls back to a normal link into the product's category page, exactly as before.

---

# Update 4: Reliable scroll-position restore (sessionStorage-based)

Testing showed Next.js's built-in back-navigation scroll restoration doesn't reliably kick in for this catalog page, since it re-fetches fresh data from the database on every visit. Update 3's fix (the smart back button) wasn't enough on its own. This update adds a deterministic, storage-based fix that doesn't depend on Next.js's internal caching at all.

Only these 2 files were touched (1 new, 1 edited).

1. **`src/components/CatalogScrollRestorer.tsx`** (new) — a tiny invisible client component that continuously remembers the catalog page's scroll position in the browser's `sessionStorage`, keyed by the *exact* URL (category + sort + stock + search all included), and restores it the instant that exact view is loaded again.
2. **`src/app/products/page.tsx`** — added `<CatalogScrollRestorer />` (wrapped in `<Suspense>`, which Next.js requires for this).

## How to apply

1. Copy `src/components/CatalogScrollRestorer.tsx` into your project (new file).
2. Copy `src/app/products/page.tsx` over your existing one.
3. No database change — restart `npm run dev` and test:
   - Browse a category, scroll down partway, click into a product, then click "Back to Catalog" (or use your phone's swipe-back gesture, or the browser's back button). You should land back at the exact same scroll position and row/column — not the top.
   - Try switching categories, scrolling, going into a product, and coming back — each category/sort/search combination remembers its own separate scroll position.

## How it works

- As you scroll the catalog page, the current scroll offset is saved to `sessionStorage` under a key built from the page's exact URL (e.g. `catalog-scroll:/products?category=locks-security`).
- The moment that exact URL is rendered again — whether you arrived via the back button, a swipe gesture, or clicking "Back to Catalog" — the saved offset is read back and the page scrolls there automatically (with a couple of short retries to account for product images still loading in).
- `sessionStorage` is per-browser-tab and clears when the tab closes, so it never leaks between visitors or devices, and it's capped to remembering positions for 30 minutes so it doesn't hold onto stale state indefinitely.
- This works the same way on mobile and desktop, since it's plain browser storage + `window.scrollTo`, not something that depends on any particular navigation method.

---

# Update 5: Fixed — Next.js was overriding the scroll restore

Testing showed the position still reset to top. Root cause: **Next.js automatically scrolls every page to the top on navigation by default** — that behavior was firing after `CatalogScrollRestorer` restored the position, undoing it. There's an official flag to disable that per-navigation (`scroll={false}` / `{ scroll: false }`), which wasn't being used yet.

Only 1 file changed: **`src/components/BackToCatalogButton.tsx`** (rewritten, not new).

## What changed

- The button now always navigates using Next's router with `{ scroll: false }`, which tells Next.js not to reset the scroll position itself — leaving `CatalogScrollRestorer` as the sole thing controlling scroll on that page.
- It also now reconstructs your **exact previous catalog URL** (category *and* sort *and* stock filter *and* search — not just category) from `document.referrer`, so you return to precisely the view you were on, not a simplified version of it.

## How to apply

1. Copy `src/components/BackToCatalogButton.tsx` over your existing one (just this one file — `CatalogScrollRestorer.tsx` and `src/app/products/page.tsx` from Update 4 stay as they are).
2. Restart `npm run dev` and test again: category → scroll → product → "Back to Catalog". This time nothing should force it back to the top.

---

# Update 6: Found the real bug — `document.referrer` doesn't work for in-app navigation

Testing showed it still wasn't working. Root cause, finally confirmed: `document.referrer` only reflects the page that caused an actual *browser-level* navigation (e.g. a hard page load) — it does **not** update when you click a Next.js `<Link>`, because that's a client-side ("soft") navigation. So the "did they come from the catalog?" check in Update 5 was almost never true, and the fallback link didn't include your sort/stock filters either, so even that path couldn't find a matching saved scroll position.

This update removes the guesswork entirely: the exact catalog URL you're browsing is now passed along explicitly as you click into a product, so "Back to Catalog" always knows precisely where to return you.

4 files changed:

1. **`src/components/HomeClientProducts.tsx`** — every product card link (image, name, "View Details") now appends `?from=<the exact catalog URL you're currently viewing>` — category, sort, stock filter, and search all included.
2. **`src/app/products/[slug]/page.tsx`** — reads that `from` value and passes it to the back button (falling back to the product's category page if there isn't one, e.g. a direct/shared link).
3. **`src/components/BackToCatalogButton.tsx`** (simplified) — now just a plain link to that exact URL with `scroll={false}`; no more referrer-guessing.
4. **`src/app/page.tsx`** and **`src/app/products/page.tsx`** — wrapped every `<HomeClientProducts />` usage in `<Suspense>`, which Next.js requires now that component reads the current URL.

## How to apply

Copy all 4 files over your existing ones (same paths), plus `README_CHANGES.md`. No database change — restart `npm run dev` and test: category → scroll down → click a product → "Back to Catalog". You should land back exactly where you were, filters and all.
