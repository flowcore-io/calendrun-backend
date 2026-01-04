import { z } from "zod";

export const UserSettingsUpdatedSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  preferences: z.record(z.unknown()).default({}),
});

export type UserSettingsUpdated = z.infer<typeof UserSettingsUpdatedSchema>;
