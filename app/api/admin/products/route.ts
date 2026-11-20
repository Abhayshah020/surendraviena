import { and, desc, eq, ilike, sql, asc, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "../../../../lib/auth/api-guard";
import { db } from "../../../../lib/db";
import { products, productBatches } from "../../../../lib/db/schema";
import { productSchema } from "../../../../lib/validations/product";
import { enrichProduct } from "../../../../lib/server/enrich-product";

export const runtime = "nodejs";


export async function GET(request: NextRequest) {
    try {
        const { response } = await requireAdmin(request);
        if (response) return response;

        const params = request.nextUrl.searchParams;

        const page = Math.max(1, Number(params.get("page")) || 1);
        const limit = Math.min(
            100,
            Math.max(1, Number(params.get("limit")) || 20)
        );
        const search = params.get("search")?.trim() || "";

        const requestedStatus = params.get("status");

        const status =
            requestedStatus === "active" ||
                requestedStatus === "inactive" ||
                requestedStatus === "all"
                ? requestedStatus
                : params.get("includeInactive") === "true"
                    ? "all"
                    : "active";

        const conditions = [];

        if (status === "active") {
            conditions.push(eq(products.isActive, true));
        } else if (status === "inactive") {
            conditions.push(eq(products.isActive, false));
        }

        if (search) {
            conditions.push(ilike(products.name, `%${search}%`));
        }

        const where = conditions.length
            ? and(...conditions)
            : undefined;

        const [items, count] = await Promise.all([
            db
                .select()
                .from(products)
                .where(where)
                .orderBy(desc(products.createdAt))
                .limit(limit)
                .offset((page - 1) * limit),

            db
                .select({
                    total: sql<number>`count(*)::int`,
                })
                .from(products)
                .where(where),
        ]);

        // Fetch batches belonging to the products on this page.
        // Enrich every product using the same logic as the single-product API.
        const enrichedProducts = await Promise.all(
            items.map((product) => enrichProduct(product))
        );

        const total = count[0]?.total ?? 0;
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            products: enrichedProducts,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
            },
        });
    } catch (error) {
        console.error("Products GET error:", error);

        return NextResponse.json(
            { message: "Unable to fetch products." },
            { status: 500 }
        );
    }
}



export async function POST(request: NextRequest) {
    try {
        const { response } = await requireAdmin(request);
        if (response) return response;

        const body = await request.json();
        const parsed = productSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    message: "Invalid product information.",
                    errors: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const data = parsed.data;

        if (Boolean(data.imageUrl) !== Boolean(data.imageKey)) {
            return NextResponse.json(
                {
                    message: "Image URL and image key must be supplied together.",
                },
                { status: 400 }
            );
        }

        let productId: string;

        if (data.initialBatch) {
            const result = await db.execute(sql`
        WITH new_product AS (
          INSERT INTO products (
            name,
            image_url,
            image_key
          )
          VALUES (
            ${data.name},
            ${data.imageUrl ?? null},
            ${data.imageKey ?? null}
          )
          RETURNING *
        ),
        new_batch AS (
          INSERT INTO product_batches (
            product_id,
            batch_number,
            cost_price,
            selling_price,
            quantity,
            expiry_date
          )
          SELECT
            id,
            ${data.initialBatch.batchNumber},
            ${data.initialBatch.costPrice},
            ${data.initialBatch.sellingPrice},
            ${data.initialBatch.quantity},
            ${data.initialBatch.expiryDate}
          FROM new_product
          RETURNING *
        )
        SELECT new_product.id
        FROM new_product
        CROSS JOIN new_batch
      `);

            const insertedProduct = result.rows[0] as
                | { id: string }
                | undefined;

            if (!insertedProduct) {
                throw new Error("Product creation failed.");
            }

            productId = insertedProduct.id;
        } else {
            const [createdProduct] = await db
                .insert(products)
                .values({
                    name: data.name,
                    imageUrl: data.imageUrl ?? null,
                    imageKey: data.imageKey ?? null,
                })
                .returning({
                    id: products.id,
                });

            if (!createdProduct) {
                throw new Error("Product creation failed.");
            }

            productId = createdProduct.id;
        }

        // Fetch the canonical product record.
        const [createdProduct] = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

        if (!createdProduct) {
            throw new Error("Created product could not be retrieved.");
        }

        // Return the same enriched structure as the GET endpoints.
        const enrichedProduct = await enrichProduct(createdProduct);

        return NextResponse.json(
            {
                message: "Product created successfully.",
                product: enrichedProduct,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Products POST error:", error);

        return NextResponse.json(
            { message: "Unable to create product." },
            { status: 500 }
        );
    }
}
