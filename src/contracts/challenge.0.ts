import { z } from "zod";

// All valid challenge variants - matches frontend variant-utils.ts
const VariantEnum = z.enum([
  "full",
  "half",
  "1/8",
  "2/8",
  "3/8",
  "4/8",
  "5/8",
  "6/8",
  "7/8",
  "8/8",
  "1/7",
  "2/7",
  "3/7",
  "4/7",
  "5/7",
  "6/7",
  "7/7",
  "1/5",
  "2/5",
  "3/5",
  "4/5",
  "5/5",
]);

export const ChallengeStartedSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  userId: z.string(),
  variant: VariantEnum,
  themeKey: z.string(),
  status: z.enum(["active", "completed"]).default("active"),
  joinedAt: z.string().datetime(),
});

export const ChallengeUpdatedSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  userId: z.string().optional(),
  variant: VariantEnum.optional(),
  themeKey: z.string().optional(),
  status: z.enum(["active", "completed"]).optional(),
  totalCompletedKm: z.number().optional(),
  succeeded: z.boolean().optional(),
  completedAt: z.string().datetime().optional(),
});

export const ChallengeCompletedSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  totalCompletedKm: z.number(),
  succeeded: z.boolean(),
  completedAt: z.string().datetime(),
});

export type ChallengeStarted = z.infer<typeof ChallengeStartedSchema>;
export type ChallengeUpdated = z.infer<typeof ChallengeUpdatedSchema>;
export type ChallengeCompleted = z.infer<typeof ChallengeCompletedSchema>;
