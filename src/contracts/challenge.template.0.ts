import { z } from "zod";

export const ChallengeTemplateCreatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  days: z.number().int().positive(),
  requiredDistancesKm: z.array(z.number().nonnegative()),
  fullDistanceTotalKm: z.number().nonnegative(),
  halfDistanceTotalKm: z.number().nonnegative(),
  themeKey: z.string(),
});

export const ChallengeTemplateUpdatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  days: z.number().int().positive().optional(),
  requiredDistancesKm: z.array(z.number().nonnegative()).optional(),
  fullDistanceTotalKm: z.number().nonnegative().optional(),
  halfDistanceTotalKm: z.number().nonnegative().optional(),
  themeKey: z.string().optional(),
});

export const ChallengeTemplateDeletedSchema = z.object({
  id: z.string().uuid(),
});

export type ChallengeTemplateCreated = z.infer<typeof ChallengeTemplateCreatedSchema>;
export type ChallengeTemplateUpdated = z.infer<typeof ChallengeTemplateUpdatedSchema>;
export type ChallengeTemplateDeleted = z.infer<typeof ChallengeTemplateDeletedSchema>;
