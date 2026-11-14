
import { z } from "zod";

const money = z
    .string()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, "Enter a valid amount.")
    .refine((value) => Number(value) >= 0, "Amount cannot be negative.");

export const productSchema = z.object({
    name: z.string().trim().min(1).max(255),
    costPrice: money.nullable().optional(),
    sellingPrice: money,
    imageUrl: z.string().url().nullable().optional(),
    imageKey: z.string().nullable().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
