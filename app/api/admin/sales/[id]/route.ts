import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { requireAdmin } from "../../../../../lib/auth/api-guard";
import { saleItems, sales, productBatches } from "../../../../../lib/db/schema";
import { db } from "../../../../../lib/db";
import { transactionDb } from "../../../../../lib/db/transaction";

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

    const [sale] = await db
      .select()
      .from(sales)
      .where(eq(sales.id, id))
      .limit(1);

    if (!sale) {
      return NextResponse.json(
        { message: "Sale not found." },
        { status: 404 }
      );
    }

    const items = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, id));

    return NextResponse.json({
      sale,
      items,
    });
  } catch (error) {
    console.error("Sale details error:", error);

    return NextResponse.json(
      { message: "Unable to fetch invoice." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: Context
) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const { id } = await context.params;
    const body = await request.json();

    if (body.action !== "VOID") {
      return NextResponse.json(
        {
          message:
            "Only VOID is supported. Completed sales cannot be reactivated.",
        },
        { status: 400 }
      );
    }

    const result = await transactionDb.transaction(async (tx) => {
      const [sale] = await tx
        .select()
        .from(sales)
        .where(eq(sales.id, id))
        .limit(1);

      if (!sale) return "NOT_FOUND";

      if (sale.status === "VOID") return "ALREADY_VOID";

      const items = await tx
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, id));

      if (items.some((item) => !item.batchId)) {
        return "MISSING_BATCH_REFERENCE";
      }

      // Restore original batch stock.
      for (const item of items) {
        const [restoredBatch] = await tx
          .update(productBatches)
          .set({
            quantity: sql`${productBatches.quantity} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(productBatches.id, item.batchId!))
          .returning({
            id: productBatches.id,
          });

        if (!restoredBatch) {
          throw new Error("BATCH_RESTORE_FAILED");
        }
      }

      const [updated] = await tx
        .update(sales)
        .set({
          status: "VOID",
          updatedAt: new Date(),
        })
        .where(eq(sales.id, id))
        .returning();

      return updated;
    });

    if (result === "NOT_FOUND") {
      return NextResponse.json(
        { message: "Sale not found." },
        { status: 404 }
      );
    }

    if (result === "ALREADY_VOID") {
      return NextResponse.json(
        { message: "This sale has already been voided." },
        { status: 409 }
      );
    }

    if (result === "MISSING_BATCH_REFERENCE") {
      return NextResponse.json(
        {
          message:
            "This historical sale has no batch references and cannot be automatically restored.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Sale voided and batch stock restored successfully.",
      sale: result,
    });
  } catch (error) {
    console.error("Sale void error:", error);

    return NextResponse.json(
      { message: "Unable to void sale." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: Context
) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    return NextResponse.json(
      {
        message:
          "Sales cannot be permanently deleted. Void the sale instead to preserve inventory and financial history.",
      },
      { status: 405 }
    );
  } catch (error) {
    console.error("Sale deletion error:", error);

    return NextResponse.json(
      { message: "Unable to process sale deletion." },
      { status: 500 }
    );
  }
}