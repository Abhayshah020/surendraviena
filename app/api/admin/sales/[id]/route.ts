
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth/api-guard";
import { saleItems, sales } from "../../../../../lib/db/schema";
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

    if (body.action === "VOID" || body.action === "COMPLETED") {
      const result = await transactionDb.transaction(async (tx) => {
        const [sale] = await tx
          .select()
          .from(sales)
          .where(eq(sales.id, id))
          .limit(1);

        if (!sale) return "NOT_FOUND";

        if (sale.status === body.action) return "ALREADY_ACTION_DONE";

        const [updated] = await tx
          .update(sales)
          .set({
            status: body.action,
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

      if (result === "ALREADY_ACTION_DONE") {
        return NextResponse.json(
          { message: "This ation to the sale has already been done." },
          { status: 409 }
        );
      }

      return NextResponse.json({
        message: `Sale ${body.action} successfully.`,
        sale: result,
      });
    } else {
      return NextResponse.json(
        { message: "Unsupported action." },
        { status: 400 }
      );
    }
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

    const { id } = await context.params;

    const result = await transactionDb.transaction(async (tx) => {
      const [sale] = await tx
        .select({ id: sales.id })
        .from(sales)
        .where(eq(sales.id, id))
        .limit(1);

      if (!sale) return false;

      // Delete associated invoice items first.
      await tx
        .delete(saleItems)
        .where(eq(saleItems.saleId, id));

      // Permanently delete the invoice.
      await tx
        .delete(sales)
        .where(eq(sales.id, id));

      return true;
    });

    if (!result) {
      return NextResponse.json(
        { message: "Sale not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Sale and associated items permanently deleted.",
    });

  } catch (error) {
    console.error("Sale deletion error:", error);

    return NextResponse.json(
      { message: "Unable to delete sale." },
      { status: 500 }
    );
  }
}
