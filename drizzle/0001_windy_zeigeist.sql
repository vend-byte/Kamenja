CREATE TABLE "import_batch_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"row_index" integer NOT NULL,
	"raw_data" text DEFAULT '{}' NOT NULL,
	"mapped_data" text DEFAULT '{}' NOT NULL,
	"image_filenames" text DEFAULT '[]' NOT NULL,
	"matched_images" text DEFAULT '[]' NOT NULL,
	"missing_images" text DEFAULT '[]' NOT NULL,
	"buying_price" real DEFAULT 0 NOT NULL,
	"selling_price" real DEFAULT 0 NOT NULL,
	"selling_price_overridden" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"errors" text,
	"warnings" text,
	"product_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(20) NOT NULL,
	"status" varchar(30) DEFAULT 'mapping' NOT NULL,
	"raw_columns" text DEFAULT '[]' NOT NULL,
	"column_mapping" text DEFAULT '{}' NOT NULL,
	"pricing_rule" text DEFAULT '{}' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"ready_rows" integer DEFAULT 0 NOT NULL,
	"duplicate_rows" integer DEFAULT 0 NOT NULL,
	"invalid_rows" integer DEFAULT 0 NOT NULL,
	"images_found" integer DEFAULT 0 NOT NULL,
	"images_missing" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"imported_rows" integer DEFAULT 0 NOT NULL,
	"updated_rows" integer DEFAULT 0 NOT NULL,
	"skipped_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"brands_found" text DEFAULT '[]' NOT NULL,
	"categories_found" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "import_batch_items" ADD CONSTRAINT "import_batch_items_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;