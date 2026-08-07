ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "show_on_homepage" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "homepage_order" integer DEFAULT 0 NOT NULL;
