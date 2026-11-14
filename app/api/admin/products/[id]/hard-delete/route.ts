
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../../../../../../lib/auth/api-guard";
import { db } from "../../../../../../lib/db";
import { products, saleItems } from "../../../../../../lib/db/schema";
import { deleteProductImage } from "../../../../../../lib/r2/storage";


interface Context {
    params: Promise<{ id: string }>;
}

export async function DELETE(
    request: NextRequest,
    context: Context
) {
    try {
        const { response } = await requireAdmin(request);
        if (response) return response;

        const { id } = await context.params;

        // Find the product and its associated image.
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

        // Check whether this product exists in sales history.
        const [existingSale] = await db
            .select({
                id: saleItems.id,
            })
            .from(saleItems)
            .where(eq(saleItems.productId, id))
            .limit(1);

        if (existingSale) {
            return NextResponse.json(
                {
                    code: "PRODUCT_HAS_SALES_HISTORY",
                    message:
                        "This product cannot be permanently deleted because it is associated with existing sales records. Deactivate it instead to preserve your accounting history.",
                    canDeactivate: true,
                },
                { status: 409 }
            );
        }

        // Permanently delete the product.
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

        // Remove its associated R2 image.
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
                ? "Product deleted successfully, but its image cleanup is pending."
                : "Product and associated image permanently deleted.",
            product: deletedProduct,
            imageCleanupPending,
        });

    } catch (error) {
        console.error("Product HARD DELETE error:", error);

        return NextResponse.json(
            {
                message: "Unable to permanently delete product. Please try again.",
            },
            { status: 500 }
        );
    }
}
