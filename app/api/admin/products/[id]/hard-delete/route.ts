import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "../../../../../../lib/auth/api-guard";
import { db } from "../../../../../../lib/db";
import { products, saleItems, productBatches } from "../../../../../../lib/db/schema";
import { deleteProductImage } from "../../../../../../lib/r2/storage";

interface Context {
    params: Promise<{ id: string }>;
}

export const runtime = "nodejs";

export async function DELETE(
    request: NextRequest,
    context: Context
) {
    try {
        const { response } = await requireAdmin(request);
        if (response) return response;

        const { id } = await context.params;

        const [existingProduct] = await db
            .select({
                id: products.id,
                name: products.name,
                imageKey: products.imageKey,
            })
            .from(products)
            .where(eq(products.id, id))
            .limit(1);

        if (!existingProduct) {
            return NextResponse.json(
                { message: "Product not found." },
                { status: 404 }
            );
        }

        const [existingSale] = await db
            .select({ id: saleItems.id })
            .from(saleItems)
            .where(eq(saleItems.productId, id))
            .limit(1);

        if (existingSale) {
            return NextResponse.json(
                {
                    code: "PRODUCT_HAS_SALES_HISTORY",
                    message:
                        "This product has sales history and cannot be permanently deleted. Deactivate it instead.",
                    canDeactivate: true,
                },
                { status: 409 }
            );
        }

        const [existingBatch] = await db
            .select({ id: productBatches.id })
            .from(productBatches)
            .where(eq(productBatches.productId, id))
            .limit(1);

        if (existingBatch) {
            return NextResponse.json(
                {
                    code: "PRODUCT_HAS_BATCHES",
                    message:
                        "This product has batch records and cannot be permanently deleted. Deactivate it instead.",
                    canDeactivate: true,
                },
                { status: 409 }
            );
        }

        const [deletedProduct] = await db
            .delete(products)
            .where(eq(products.id, id))
            .returning({
                id: products.id,
                name: products.name,
            });

        if (!deletedProduct) {
            return NextResponse.json(
                { message: "Product not found." },
                { status: 404 }
            );
        }

        let imageCleanupPending = false;

        if (existingProduct.imageKey) {
            try {
                await deleteProductImage(existingProduct.imageKey);
            } catch (cleanupError) {
                imageCleanupPending = true;

                console.error(
                    "Product image cleanup failed:",
                    cleanupError
                );
            }
        }

        return NextResponse.json({
            message: imageCleanupPending
                ? "Product deleted, but image cleanup is pending."
                : "Product and associated image permanently deleted.",
            product: deletedProduct,
            imageCleanupPending,
        });
    } catch (error) {
        console.error("Product HARD DELETE error:", error);

        return NextResponse.json(
            {
                message: "Unable to permanently delete product.",
            },
            { status: 500 }
        );
    }
}