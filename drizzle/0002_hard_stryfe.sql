ALTER TABLE "import_batches" ADD COLUMN "embedded_images_found" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "filename_images_found" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "url_images_found" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "mapping_high_confidence" boolean DEFAULT false NOT NULL;