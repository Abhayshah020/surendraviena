import { asc, eq } from "drizzle-orm";
import { productBatches } from "../db/schema";
import { db } from "../db";

export async function enrichProduct(product: any) {
  const batches = await db
    .select()
    .from(productBatches)
    .where(eq(productBatches.productId, product.id))
    .orderBy(
      asc(productBatches.expiryDate),
      asc(productBatches.receivedAt)
    );

  // Nepal local calendar date.
  const nepalDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const activeBatches = batches.filter(
    (batch) =>
      batch.isActive &&
      batch.quantity > 0 &&
      batch.expiryDate >= nepalDate
  );

  const totalStock = batches.reduce(
    (total, batch) => total + batch.quantity,
    0
  );

  const availableStock = activeBatches.reduce(
    (total, batch) => total + batch.quantity,
    0
  );

  const firstAvailableBatch = activeBatches[0] ?? null;

  return {
    ...product,

    batches,

    totalStock,
    availableStock,

    sellingPrice: firstAvailableBatch
      ? firstAvailableBatch.sellingPrice
      : null,

    lowestSellingPrice:
      activeBatches.length > 0
        ? Math.min(
            ...activeBatches.map((batch) =>
              Number(batch.sellingPrice)
            )
          )
        : null,

    highestSellingPrice:
      activeBatches.length > 0
        ? Math.max(
            ...activeBatches.map((batch) =>
              Number(batch.sellingPrice)
            )
          )
        : null,

    earliestExpiry: firstAvailableBatch?.expiryDate ?? null,
  };
}