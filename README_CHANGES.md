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
