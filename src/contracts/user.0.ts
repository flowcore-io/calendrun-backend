import { z } from "zod";

export const UserCreatedSchema = z.object({
  id: z.string(), // Keycloak user ID (not UUID)
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export const UserUpdatedSchema = z.object({
  id: z.string(), // Keycloak user ID (not UUID)
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export type UserCreated = z.infer<typeof UserCreatedSchema>;
export type UserUpdated = z.infer<typeof UserUpdatedSchema>;
