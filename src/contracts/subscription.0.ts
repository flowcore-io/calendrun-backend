import { z } from "zod";

export const SubscriptionCreatedSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string(),
  status: z.enum([
    "active",
    "canceled",
    "past_due",
    "trialing",
    "incomplete",
    "incomplete_expired",
    "unpaid",
  ]),
  currentPeriodEnd: z.string().datetime().optional(),
  priceId: z.string().optional(),
});

export const SubscriptionUpdatedSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  status: z
    .enum([
      "active",
      "canceled",
      "past_due",
      "trialing",
      "incomplete",
      "incomplete_expired",
      "unpaid",
    ])
    .optional(),
  currentPeriodEnd: z.string().datetime().optional(),
  priceId: z.string().optional(),
});

export const SubscriptionDeletedSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  stripeSubscriptionId: z.string(),
});

export type SubscriptionCreated = z.infer<typeof SubscriptionCreatedSchema>;
export type SubscriptionUpdated = z.infer<typeof SubscriptionUpdatedSchema>;
export type SubscriptionDeleted = z.infer<typeof SubscriptionDeletedSchema>;
