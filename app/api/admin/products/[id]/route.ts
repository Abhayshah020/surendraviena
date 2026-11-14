
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth/api-guard";
import { db } from "../../../../../lib/db";
import { products } from "../../../../../lib/db/schema";
import { productSchema } from "../../../../../lib/validations/product";
import { deleteProductImage } from "../../../../../lib/r2/storage";


export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
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

    return NextResponse.json({ product });
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

    const parsed = productSchema.partial().safeParse(body);

    if (!parsed.success || Object.keys(body).length === 0) {
      return NextResponse.json(
        { message: "Invalid product information." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (
      (data.imageUrl !== undefined || data.imageKey !== undefined) &&
      Boolean(data.imageUrl) !== Boolean(data.imageKey)
    ) {
      return NextResponse.json(
        {
          message: "Image URL and image key must be supplied together.",
        },
        { status: 400 }
      );
    }

    // Get the previous image key before updating.
    const [existingProduct] = await db
      .select({
        id: products.id,
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

    const [product] = await db
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!product) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    let imageCleanupPending = false;

    const previousImageKey = existingProduct.imageKey;
    const newImageKey = product.imageKey;

    // Delete the previous R2 image only after the database update succeeds.
    if (
      previousImageKey &&
      previousImageKey !== newImageKey
    ) {
      try {
        await deleteProductImage(previousImageKey);
      } catch (cleanupError) {
        imageCleanupPending = true;

        console.error(
          "Previous product image cleanup failed:",
          cleanupError
        );
      }
    }

    return NextResponse.json({
      message: imageCleanupPending
        ? "Product updated, but the previous image could not be cleaned up."
        : "Product updated successfully.",
      product,
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
