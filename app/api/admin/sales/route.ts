import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  sql,
} from "drizzle-orm";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth/api-guard";
import {
  products,
  productBatches,
  saleItems,
  sales,
} from "../../../../lib/db/schema";
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
    const limit = Math.min(
      100,
      Math.max(1, Number(params.get("limit")) || 20)
    );


    const productId = params.get("productId");
    const search = params.get("search")?.trim() || "";
    const from = params.get("from");
    const to = params.get("to");
    const status = params.get("status");


    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      productId &&
      productId !== "ALL" &&
      !UUID_REGEX.test(productId)
    ) {
      return NextResponse.json(
        { message: "Invalid product selected." },
        { status: 400 }
      );
    }

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

    if (productId && productId !== "ALL") {
      conditions.push(
        sql`EXISTS (
      SELECT 1
      FROM sale_items si
      WHERE
        si.sale_id = ${sales.id}
        AND si.product_id = ${productId}::uuid
    )`
      );
    }


    const where = conditions.length ? and(...conditions) : undefined;

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

    if (data.items.length === 0) {
      return NextResponse.json(
        { message: "A sale must contain at least one item." },
        { status: 400 }
      );
    }

    // Combine duplicate product lines before allocation.
    const aggregatedItems = new Map<string, number>();

    for (const item of data.items) {
      aggregatedItems.set(
        item.productId,
        (aggregatedItems.get(item.productId) ?? 0) + item.quantity
      );
    }

    const requestedItems = Array.from(aggregatedItems.entries()).map(
      ([productId, quantity]) => ({
        productId,
        quantity,
      })
    );

    const productIds = requestedItems.map((item) => item.productId);

    const selectedProducts = await db
      .select()
      .from(products)
      .where(
        and(
          inArray(products.id, productIds),
          eq(products.isActive, true)
        )
      );

    if (selectedProducts.length !== requestedItems.length) {
      return NextResponse.json(
        { message: "One or more products are unavailable." },
        { status: 400 }
      );
    }

    const productMap = new Map(
      selectedProducts.map((product) => [product.id, product])
    );

    // Invoice number.
    const invoiceNumber = [
      "PH",
      new Date().toISOString().slice(0, 10).replace(/-/g, ""),
      crypto.randomUUID().slice(0, 8).toUpperCase(),
    ].join("-");

    // Nepal local date for expiry comparisons.
    const nepalDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const result = await transactionDb.transaction(async (tx) => {
      const allocatedLines: {
        productId: string;
        productName: string;
        batchId: string;
        batchNumber: string;
        quantity: number;
        unitPricePaisa: bigint;
        unitCostPaisa: bigint;
        lineTotalPaisa: bigint;
      }[] = [];

      // Allocate each product from eligible batches, FEFO.
      for (const requested of requestedItems) {
        const product = productMap.get(requested.productId);

        if (!product) {
          throw new Error("PRODUCT_UNAVAILABLE");
        }

        const batches = await tx
          .select()
          .from(productBatches)
          .where(
            and(
              eq(productBatches.productId, requested.productId),
              eq(productBatches.isActive, true),
              gte(productBatches.quantity, 1),
              gte(productBatches.expiryDate, nepalDate)
            )
          )
          .orderBy(
            productBatches.expiryDate,
            productBatches.receivedAt,
            productBatches.id
          );

        let remaining = requested.quantity;

        for (const batch of batches) {
          if (remaining <= 0) break;

          const allocatedQuantity = Math.min(
            remaining,
            batch.quantity
          );

          const unitPricePaisa = toPaisa(batch.sellingPrice);
          const unitCostPaisa = toPaisa(batch.costPrice);

          allocatedLines.push({
            productId: product.id,
            productName: product.name,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            quantity: allocatedQuantity,
            unitPricePaisa,
            unitCostPaisa,
            lineTotalPaisa:
              unitPricePaisa * BigInt(allocatedQuantity),
          });

          remaining -= allocatedQuantity;
        }

        if (remaining > 0) {
          throw new Error(
            `INSUFFICIENT_STOCK:${product.name}`
          );
        }
      }

      const subtotal = allocatedLines.reduce(
        (sum, line) => sum + line.lineTotalPaisa,
        BigInt(0)
      );

      const discount = toPaisa(data.discountAmount);

      if (discount < 0 || discount > subtotal) {
        throw new Error("INVALID_DISCOUNT");
      }

      const total = subtotal - discount;

      // Proportionally allocate discount across all batch lines.
      let allocatedDiscount = BigInt(0);

      const itemValues = allocatedLines.map(
        (line, index) => {
          const lineDiscount =
            index === allocatedLines.length - 1
              ? discount - allocatedDiscount
              : subtotal === BigInt(0)
                ? BigInt(0)
                : (discount * line.lineTotalPaisa) / subtotal;

          allocatedDiscount += lineDiscount;

          return {
            productId: line.productId,
            batchId: line.batchId,
            productName: line.productName,
            quantity: line.quantity,
            unitPrice: fromPaisa(line.unitPricePaisa),
            unitCost: fromPaisa(line.unitCostPaisa),
            lineTotal: fromPaisa(line.lineTotalPaisa),
            lineDiscount: fromPaisa(lineDiscount),
          };
        }
      );

      // Stock deductions.
      for (const line of allocatedLines) {
        const [updatedBatch] = await tx
          .update(productBatches)
          .set({
            quantity: sql`${productBatches.quantity} - ${line.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productBatches.id, line.batchId),
              gte(productBatches.quantity, line.quantity),
              eq(productBatches.isActive, true)
            )
          )
          .returning({
            id: productBatches.id,
          });

        if (!updatedBatch) {
          throw new Error(
            `STOCK_CONFLICT:${line.productName}`
          );
        }
      }

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
    if (error instanceof Error) {
      if (error.message === "PRODUCT_UNAVAILABLE") {
        return NextResponse.json(
          { message: "One or more products are unavailable." },
          { status: 400 }
        );
      }

      if (error.message === "INVALID_DISCOUNT") {
        return NextResponse.json(
          { message: "Invalid sale discount." },
          { status: 400 }
        );
      }

      if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
        return NextResponse.json(
          {
            message: `Insufficient stock for ${error.message.split(":")[1]}.`,
          },
          { status: 409 }
        );
      }

      if (error.message.startsWith("STOCK_CONFLICT:")) {
        return NextResponse.json(
          {
            message: `Stock changed during checkout for ${error.message.split(":")[1]}. Please retry.`,
          },
          { status: 409 }
        );
      }
    }

    console.error("Sales POST error:", error);

    return NextResponse.json(
      { message: "Unable to complete sale." },
      { status: 500 }
    );
  }
}