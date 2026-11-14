
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../../../../../../lib/auth/api-guard";
import { db } from "../../../../../../lib/db";
import { products } from "../../../../../../lib/db/schema";

interface Context {
    params: Promise<{ id: string }>;
}

export async function POST(
    request: NextRequest,
    context: Context
) {
    try {
        const { response } = await requireAdmin(request);
        if (response) return response;

        const { id } = await context.params;

        const [product] = await db
            .update(products)
            .set({
                isActive: true,
                updatedAt: new Date(),
            })
            .where(eq(products.id, id))
            .returning({
                id: products.id,
                name: products.name,
                isActive: products.isActive,
            });

        if (!product) {
            return NextResponse.json(
                { message: "Product not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Product reactivated successfully.",
            product,
        });
    } catch (error) {
        console.error("Product REACTIVATE error:", error);

        return NextResponse.json(
            { message: "Unable to reactivate product." },
            { status: 500 }
        );
    }
}
