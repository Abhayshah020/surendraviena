import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "../../../../../lib/auth/api-guard";
import { db } from "../../../../../lib/db";
import { products, productBatches } from "../../../../../lib/db/schema";
import { productUpdateSchema } from "../../../../../lib/validations/product";
import { deleteProductImage } from "../../../../../lib/r2/storage";
import { enrichProduct } from "../../../../../lib/server/enrich-product";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: Context
) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const { id } = await context.params;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    const enrichedProduct = await enrichProduct(product);

    return NextResponse.json({
      product: enrichedProduct,
    });
  } catch (error) {
    console.error("Product GET error:", error);

    return NextResponse.json(
      { message: "Unable to fetch product." },
      { status: 500 }
    );
  }
}


export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const { id } = await context.params;
    const body = await request.json();

    const parsed = productUpdateSchema.safeParse(body);

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

    const [existingProduct] = await db
      .select({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
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

    // Validate the final image pair, including unchanged values.
    const finalImageUrl =
      data.imageUrl !== undefined
        ? data.imageUrl
        : existingProduct.imageUrl;

    const finalImageKey =
      data.imageKey !== undefined
        ? data.imageKey
        : existingProduct.imageKey;

    if (Boolean(finalImageUrl) !== Boolean(finalImageKey)) {
      return NextResponse.json(
        {
          message: "Image URL and image key must be supplied together.",
        },
        { status: 400 }
      );
    }

    // Update product master information.
    const productUpdates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      productUpdates.name = data.name;
    }

    if (data.imageUrl !== undefined) {
      productUpdates.imageUrl = data.imageUrl;
    }

    if (data.imageKey !== undefined) {
      productUpdates.imageKey = data.imageKey;
    }

    const [product] = await db
      .update(products)
      .set(productUpdates)
      .where(eq(products.id, id))
      .returning();

    if (!product) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    // Optionally update an existing batch or create a new one.
    let batch = null;

    if (data.batch) {
      const batchData = {
        batchNumber: data.batch.batchNumber,
        costPrice: data.batch.costPrice,
        sellingPrice: data.batch.sellingPrice,
        quantity: data.batch.quantity,
        expiryDate: data.batch.expiryDate,
        updatedAt: new Date(),
      };

      if (data.batch.id) {
        // Update only a batch belonging to this product.
        const [updatedBatch] = await db
          .update(productBatches)
          .set(batchData)
          .where(
            and(
              eq(productBatches.id, data.batch.id),
              eq(productBatches.productId, id)
            )
          )
          .returning();

        if (!updatedBatch) {
          return NextResponse.json(
            {
              message: "Batch not found for this product.",
            },
            { status: 404 }
          );
        }

        batch = updatedBatch;
      } else {
        // Create another batch for the existing product.
        const [createdBatch] = await db
          .insert(productBatches)
          .values({
            productId: id,
            ...batchData,
          })
          .returning();

        batch = createdBatch;
      }
    }

    // Clean up the previous image only after the product update succeeds.
    let imageCleanupPending = false;

    if (
      existingProduct.imageKey &&
      existingProduct.imageKey !== product.imageKey
    ) {
      try {
        await deleteProductImage(existingProduct.imageKey);
      } catch (cleanupError) {
        imageCleanupPending = true;

        console.error(
          "Previous product image cleanup failed:",
          cleanupError
        );
      }
    }

    // Generate the complete updated product response.
    const enrichedProduct = await enrichProduct(product);

    return NextResponse.json({
      message: imageCleanupPending
        ? "Product updated, but the previous image could not be cleaned up."
        : "Product updated successfully.",

      product: enrichedProduct,
      imageCleanupPending,
    });
  } catch (error) {
    console.error("Product PATCH error:", error);

    return NextResponse.json(
      { message: "Unable to update product." },
      { status: 500 }
    );
  }
}


export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const { id } = await context.params;

    const [product] = await db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Product deactivated successfully.",
    });
  } catch (error) {
    console.error("Product DELETE error:", error);

    return NextResponse.json(
      { message: "Unable to deactivate product." },
      { status: 500 }
    );
  }
}