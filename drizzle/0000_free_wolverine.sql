CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity" varchar(50),
	"entity_id" integer,
	"description" text,
	"ip_address" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"full_name" varchar(255),
	"email" varchar(255),
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'Manager' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(255),
	"image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"product_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email" varchar(255),
	"location" varchar(255),
	"business_name" varchar(255),
	"total_spent" integer DEFAULT 0 NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"last_order_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"link" varchar(255),
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"customer_id" integer,
	"customer_name" varchar(255),
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"payment_method" varchar(50),
	"delivery_status" varchar(50) DEFAULT 'Pending',
	"items" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(255) NOT NULL,
	"barcode" varchar(255),
	"sku" varchar(255),
	"name" varchar(255) NOT NULL,
	"name_local" varchar(255),
	"name_chinese" varchar(255),
	"brand" varchar(255),
	"model" varchar(255),
	"slug" varchar(255) NOT NULL,
	"category_id" integer,
	"subcategory" varchar(255),
	"supplier" varchar(255),
	"country_of_origin" varchar(100),
	"warranty" varchar(255),
	"description" text,
	"short_description" text,
	"features" text,
	"specifications" text,
	"buying_price_rmb" real DEFAULT 0 NOT NULL,
	"exchange_rate" real DEFAULT 20 NOT NULL,
	"buying_price" integer DEFAULT 0 NOT NULL,
	"wholesale_price" integer DEFAULT 0 NOT NULL,
	"retail_price" integer DEFAULT 0 NOT NULL,
	"discount_price" integer,
	"vat_percent" real DEFAULT 16 NOT NULL,
	"tax_percent" real DEFAULT 0 NOT NULL,
	"transport_cost" integer DEFAULT 0 NOT NULL,
	"import_cost" integer DEFAULT 0 NOT NULL,
	"other_expenses" integer DEFAULT 0 NOT NULL,
	"qty_per_carton" integer DEFAULT 1 NOT NULL,
	"middle_pack" integer,
	"pieces_per_pack" integer,
	"weight" real DEFAULT 0 NOT NULL,
	"length" real,
	"width" real,
	"height" real,
	"unit" varchar(50) DEFAULT 'pcs',
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"opening_stock" integer DEFAULT 0 NOT NULL,
	"min_stock_level" integer DEFAULT 5 NOT NULL,
	"max_stock_level" integer DEFAULT 500 NOT NULL,
	"reorder_level" integer DEFAULT 10 NOT NULL,
	"stock_status" varchar(50) DEFAULT 'In Stock' NOT NULL,
	"storage_location" varchar(255),
	"shelf_number" varchar(50),
	"warehouse" varchar(100),
	"color" varchar(100),
	"material" varchar(100),
	"size" varchar(100),
	"packaging_type" varchar(100),
	"serial_number" varchar(100),
	"batch_number" varchar(100),
	"manufacturing_date" timestamp,
	"expiration_date" timestamp,
	"tags" text,
	"keywords" text,
	"delivery_time" varchar(100),
	"shipping_weight" real,
	"shipping_charges" integer DEFAULT 0 NOT NULL,
	"free_delivery" boolean DEFAULT false NOT NULL,
	"courier_options" text,
	"fragile" boolean DEFAULT false NOT NULL,
	"returnable" boolean DEFAULT true NOT NULL,
	"cash_on_delivery" boolean DEFAULT true NOT NULL,
	"show_on_homepage" boolean DEFAULT false NOT NULL,
	"show_on_featured" boolean DEFAULT false NOT NULL,
	"show_on_new_arrivals" boolean DEFAULT true NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"available_online" boolean DEFAULT true NOT NULL,
	"available_in_store" boolean DEFAULT true NOT NULL,
	"images" text DEFAULT '[]' NOT NULL,
	"featured_image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_new_arrival" boolean DEFAULT true NOT NULL,
	"is_best_seller" boolean DEFAULT false NOT NULL,
	"is_on_offer" boolean DEFAULT false NOT NULL,
	"is_hot_deal" boolean DEFAULT false NOT NULL,
	"is_limited_stock" boolean DEFAULT false NOT NULL,
	"is_coming_soon" boolean DEFAULT false NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"offer_percent" integer,
	"offer_start_date" timestamp,
	"offer_end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_code_unique" UNIQUE("code"),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"min_purchase" integer DEFAULT 0 NOT NULL,
	"max_discount" integer,
	"usage_limit" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"business_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(50) NOT NULL,
	"whatsapp_number" varchar(50),
	"location" varchar(255),
	"message" text,
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"items" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"product_name" varchar(255),
	"type" varchar(50) NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock" integer DEFAULT 0 NOT NULL,
	"new_stock" integer DEFAULT 0 NOT NULL,
	"reason" text,
	"reference" varchar(255),
	"performed_by" varchar(100) DEFAULT 'Admin',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"country" varchar(100),
	"address" text,
	"notes" text,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;