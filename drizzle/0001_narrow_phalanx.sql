CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"image_url" text,
	"image_key" text,
	"cost_price" numeric(12, 2),
	"selling_price" numeric(12, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_selling_price_check" CHECK ("products"."selling_price" >= 0),
	CONSTRAINT "products_cost_price_check" CHECK ("products"."cost_price" IS NULL OR "products"."cost_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"unit_cost" numeric(12, 2),
	"line_total" numeric(12, 2) NOT NULL,
	"line_discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sale_items_quantity_check" CHECK ("sale_items"."quantity" > 0),
	CONSTRAINT "sale_items_unit_price_check" CHECK ("sale_items"."unit_price" >= 0),
	CONSTRAINT "sale_items_line_total_check" CHECK ("sale_items"."line_total" >= 0),
	CONSTRAINT "sale_items_line_discount_check" CHECK ("sale_items"."line_discount" >= 0 AND "sale_items"."line_discount" <= "sale_items"."line_total")
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"customer_name" varchar(150) DEFAULT 'Anonymous Customer' NOT NULL,
	"customer_phone" varchar(30),
	"sold_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'COMPLETED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "sales_subtotal_check" CHECK ("sales"."subtotal" >= 0),
	CONSTRAINT "sales_discount_check" CHECK ("sales"."discount_amount" >= 0 AND "sales"."discount_amount" <= "sales"."subtotal"),
	CONSTRAINT "sales_total_check" CHECK ("sales"."total_amount" >= 0),
	CONSTRAINT "sales_status_check" CHECK ("sales"."status" IN ('COMPLETED', 'VOID'))
);
--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "products_active_idx" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_items_product_id_idx" ON "sale_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_invoice_number_idx" ON "sales" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "sales_sold_at_idx" ON "sales" USING btree ("sold_at");--> statement-breakpoint
CREATE INDEX "sales_customer_phone_idx" ON "sales" USING btree ("customer_phone");--> statement-breakpoint
CREATE INDEX "sales_status_idx" ON "sales" USING btree ("status");