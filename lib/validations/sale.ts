
import { z } from "zod";

export const saleSchema = z.object({
  customerName: z
    .string()
    .trim()
    .max(150)
    .optional()
    .default("Anonymous Customer"),

  customerPhone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable(),

  discountAmount: z
    .string()
    .regex(/^\d{1,10}(\.\d{1,2})?$/)
    .default("0"),

  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(100000),
      })
    )
    .min(1)
    .max(100),
}).superRefine((data, ctx) => {
  const ids = data.items.map((item) => item.productId);

  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: "custom",
      path: ["items"],
      message: "Duplicate products must be combined into one item.",
    });
  }

  if (
    data.discountAmount !== undefined &&
    !Number.isFinite(Number(data.discountAmount))
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["discountAmount"],
      message: "Invalid discount.",
    });
  }
});

export type SaleInput = z.infer<typeof saleSchema>;
