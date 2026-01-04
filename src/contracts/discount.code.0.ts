import { z } from "zod";

export const DiscountCodeCreatedSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  bundleId: z.string().uuid().optional(),
  discountType: z.enum(["full", "percentage", "fixed"]),
  discountValue: z.number().nonnegative(),
  maxUses: z.number().int().positive(),
  usedCount: z.number().int().nonnegative().default(0),
  expiresAt: z.string().datetime().optional(),
  redeemedBy: z.array(z.string()).default([]),
  createdBy: z.string(),
  isActive: z.boolean().default(true),
});

export const DiscountCodeUpdatedSchema = z.object({
  id: z.string().uuid(),
  bundleId: z.string().uuid().optional(),
  discountType: z.enum(["full", "percentage", "fixed"]).optional(),
  discountValue: z.number().nonnegative().optional(),
  maxUses: z.number().int().positive().optional(),
  usedCount: z.number().int().nonnegative().optional(),
  expiresAt: z.string().datetime().optional(),
  redeemedBy: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const DiscountCodeDeletedSchema = z.object({
  id: z.string().uuid(),
});

export const DiscountCodeRedeemedSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
});

export type DiscountCodeCreated = z.infer<typeof DiscountCodeCreatedSchema>;
export type DiscountCodeUpdated = z.infer<typeof DiscountCodeUpdatedSchema>;
export type DiscountCodeDeleted = z.infer<typeof DiscountCodeDeletedSchema>;
export type DiscountCodeRedeemed = z.infer<typeof DiscountCodeRedeemedSchema>;
