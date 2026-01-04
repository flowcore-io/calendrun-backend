import { z } from "zod";

export const DiscountBundlePurchasedSchema = z.object({
  id: z.string().uuid(),
  clubName: z.string(),
  purchasedBy: z.string(),
  contactEmail: z.string().optional(),
  paymentMethod: z.enum(["card", "invoice"]).default("card"),
  stripePaymentIntentId: z.string().optional(),
  stripeInvoiceId: z.string().optional(),
  status: z.enum(["pending", "active", "expired", "canceled"]).default("pending"),
  codeCount: z.number().int().positive(),
  priceAmount: z.number().nonnegative(),
  priceCurrency: z.string().default("dkk"),
  codeIds: z.array(z.string().uuid()).default([]),
  codePrefix: z.string().optional(),
  validUntil: z.string().datetime(),
});

export const DiscountBundleUpdatedSchema = z.object({
  id: z.string().uuid(),
  clubName: z.string().optional(),
  contactEmail: z.string().optional(),
  paymentMethod: z.enum(["card", "invoice"]).optional(),
  stripePaymentIntentId: z.string().optional(),
  stripeInvoiceId: z.string().optional(),
  status: z.enum(["pending", "active", "expired", "canceled"]).optional(),
  codeCount: z.number().int().positive().optional(),
  priceAmount: z.number().nonnegative().optional(),
  priceCurrency: z.string().optional(),
  codeIds: z.array(z.string().uuid()).optional(),
  codePrefix: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

export const DiscountBundleDeletedSchema = z.object({
  id: z.string().uuid(),
});

export type DiscountBundlePurchased = z.infer<typeof DiscountBundlePurchasedSchema>;
export type DiscountBundleUpdated = z.infer<typeof DiscountBundleUpdatedSchema>;
export type DiscountBundleDeleted = z.infer<typeof DiscountBundleDeletedSchema>;
