
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  sql,
} from "drizzle-orm";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth/api-guard";
import { products, saleItems, sales } from "../../../../lib/db/schema";
import { db } from "../../../../lib/db";
import { saleSchema } from "../../../../lib/validations/sale";
import { fromPaisa, toPaisa } from "../../../../lib/utils/money";
import { transactionDb } from "../../../../lib/db/transaction";



export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const params = request.nextUrl.searchParams;

    const page = Math.max(1, Number(params.get("page")) || 1);
    const limit = Math.max(1, Number(params.get("limit")) || 20)

    const search = params.get("search")?.trim() || "";
    const from = params.get("from");
    const to = params.get("to");
    const status = params.get("status");

    const conditions = [];

    if (search) {
      conditions.push(
        sql`(
          ${sales.invoiceNumber} ILIKE ${"%" + search + "%"}
          OR ${sales.customerName} ILIKE ${"%" + search + "%"}
          OR ${sales.customerPhone} ILIKE ${"%" + search + "%"}
        )`
      );
    }

    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
      conditions.push(
        gte(sales.soldAt, new Date(`${from}T00:00:00+05:45`))
      );
    }

    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      const nextDay = new Date(`${to}T00:00:00+05:45`);
      nextDay.setDate(nextDay.getDate() + 1);
      conditions.push(lt(sales.soldAt, nextDay));
    }

    if (status === "COMPLETED" || status === "VOID") {
      conditions.push(eq(sales.status, status));
    }

    const where = conditions.length
      ? and(...conditions)
      : undefined;

    const [items, count] = await Promise.all([
      db
        .select()
        .from(sales)
        .where(where)
        .orderBy(desc(sales.soldAt))
        .limit(limit)
        .offset((page - 1) * limit),

      db
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(sales)
        .where(where),
    ]);

    return NextResponse.json({
      sales: items,
      pagination: {
        page,
        limit,
        total: count[0]?.total ?? 0,
        totalPages: Math.ceil((count[0]?.total ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error("Sales GET error:", error);

    return NextResponse.json(
      { message: "Unable to fetch sales." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const body = await request.json();
    const parsed = saleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid sale information.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const productIds = data.items.map((item) => item.productId);

    const selectedProducts = await db
      .select()
      .from(products)
      .where(
        and(
          inArray(products.id, productIds),
          eq(products.isActive, true)
        )
      );

    if (selectedProducts.length !== data.items.length) {
      return NextResponse.json(
        {
          message: "One or more products are unavailable.",
        },
        { status: 400 }
      );
    }

    const productMap = new Map(
      selectedProducts.map((product) => [
        product.id,
        product,
      ])
    );

    const lines = data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = toPaisa(product.sellingPrice);
      const lineTotal = unitPrice * BigInt(item.quantity);

      return {
        product,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      };
    });

    const subtotal = lines.reduce(
      (sum, line) => sum + line.lineTotal,
      BigInt(0)
    );

    const discount = toPaisa(data.discountAmount);

    if (discount > subtotal) {
      return NextResponse.json(
        { message: "Discount cannot exceed the subtotal." },
        { status: 400 }
      );
    }

    const total = subtotal - discount;

    // Allocate discount proportionally using integer paisa.
    let allocated = BigInt(0);

    const itemValues = lines.map((line, index) => {
      const lineDiscount =
        index === lines.length - 1
          ? discount - allocated
          : (discount * line.lineTotal) / subtotal;

      allocated += lineDiscount;

      return {
        productId: line.product.id,
        productName: line.product.name,
        quantity: line.quantity,
        unitPrice: fromPaisa(line.unitPrice),
        unitCost: line.product.costPrice,
        lineTotal: fromPaisa(line.lineTotal),
        lineDiscount: fromPaisa(lineDiscount),
      };
    });

    // Random suffix prevents invoice-number collisions.
    const invoiceNumber = [
      "PH",
      new Date().toISOString().slice(0, 10).replace(/-/g, ""),
      crypto.randomUUID().slice(0, 8).toUpperCase(),
    ].join("-");

    const result = await transactionDb.transaction(async (tx) => {
      const [sale] = await tx
        .insert(sales)
        .values({
          invoiceNumber,
          customerName:
            data.customerName?.trim() || "Anonymous Customer",
          customerPhone: data.customerPhone || null,
          subtotal: fromPaisa(subtotal),
          discountAmount: fromPaisa(discount),
          totalAmount: fromPaisa(total),
          status: "COMPLETED",
        })
        .returning();

      const insertedItems = await tx
        .insert(saleItems)
        .values(
          itemValues.map((item) => ({
            saleId: sale.id,
            ...item,
          }))
        )
        .returning();

      return {
        sale,
        items: insertedItems,
      };
    });

    return NextResponse.json(
      {
        message: "Sale completed successfully.",
        ...result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sales POST error:", error);

    return NextResponse.json(
      { message: "Unable to complete sale." },
      { status: 500 }
    );
  }
}
