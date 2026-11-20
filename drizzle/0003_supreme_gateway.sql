CREATE TABLE "product_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"cost_price" numeric(12, 2) NOT NULL,
	"selling_price" numeric(12, 2) NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"expiry_date" date NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_batches_product_batch_unique" UNIQUE("product_id","batch_number"),
	CONSTRAINT "product_batches_cost_price_check" CHECK ("product_batches"."cost_price" >= 0),
	CONSTRAINT "product_batches_selling_price_check" CHECK ("product_batches"."selling_price" >= 0),
	CONSTRAINT "product_batches_quantity_check" CHECK ("product_batches"."quantity" >= 0)
);
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_selling_price_check";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_cost_price_check";--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_batches_product_id_idx" ON "product_batches" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_batches_expiry_date_idx" ON "product_batches" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "product_batches_active_idx" ON "product_batches" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "cost_price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "selling_price";