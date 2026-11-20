import { z } from "zod";

const priceSchema = z
  .string()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, "Invalid price.")
  .refine((value) => Number(value) >= 0, "Price must be non-negative.");

const initialBatchSchema = z.object({
  batchNumber: z.string().trim().min(1).max(100),
  costPrice: priceSchema,
  sellingPrice: priceSchema,
  quantity: z.coerce.number().int().positive(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid expiry date."),
});

export const productSchema = z.object({
  name: z.string().trim().min(1).max(255),

  imageUrl: z.string().url().nullable().optional(),
  imageKey: z.string().trim().nullable().optional(),

  initialBatch: initialBatchSchema.optional(),
});

export const existingProductUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  imageUrl: z.string().url().nullable().optional(),
  imageKey: z.string().trim().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required.",
});

const batchSchema = z.object({
  id: z.string().uuid().optional(),
  batchNumber: z.string().trim().min(1).max(100),
  costPrice: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/),
  sellingPrice: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/),
  quantity: z.number().int().min(0),
  expiryDate: z.string().min(1),
});

// Keep your existing productUpdateSchema fields.
export const productUpdateSchema = existingProductUpdateSchema.extend({
  batch: batchSchema.optional(),
});