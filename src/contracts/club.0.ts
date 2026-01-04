import { z } from "zod";

export const ClubCreatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  inviteToken: z.string(),
  logoUrl: z.string().url().optional(),
  welcomeText: z.record(z.unknown()).optional(),
  shortDescription: z.record(z.unknown()).optional(),
});

export const ClubUpdatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  description: z.string().optional(),
  inviteToken: z.string().optional(),
  logoUrl: z.string().url().optional(),
  welcomeText: z.record(z.unknown()).optional(),
  shortDescription: z.record(z.unknown()).optional(),
});

export const ClubMemberJoinedSchema = z.object({
  id: z.string().uuid(),
  clubId: z.string().uuid(),
  userId: z.string(),
  userName: z.string().optional(),
  role: z.enum(["admin", "member"]).default("member"),
  joinedAt: z.string().datetime(),
});

export const ClubMemberLeftSchema = z.object({
  id: z.string().uuid(),
  clubId: z.string().uuid(),
  userId: z.string(),
});

export type ClubCreated = z.infer<typeof ClubCreatedSchema>;
export type ClubUpdated = z.infer<typeof ClubUpdatedSchema>;
export type ClubMemberJoined = z.infer<typeof ClubMemberJoinedSchema>;
export type ClubMemberLeft = z.infer<typeof ClubMemberLeftSchema>;
