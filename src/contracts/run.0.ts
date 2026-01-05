import { z } from "zod";

// Coerce notes to string (handles both string and number)
const NotesSchema = z
  .union([z.string(), z.number()])
  .transform((val) => (typeof val === "number" ? String(val) : val))
  .optional();

// Status enum including "deleted"
const StatusEnum = z.enum(["planned", "completed", "skipped", "deleted"]);

// ChangeLog can be object, array, or string (coerce string to object)
const ChangeLogSchema = z
  .union([
    z.record(z.unknown()),
    z.array(z.unknown()),
    z.string().transform((val) => {
      try {
        return JSON.parse(val);
      } catch {
        return { raw: val };
      }
    }),
  ])
  .optional();

export const RunLoggedSchema = z.object({
  id: z.string().uuid(),
  instanceId: z.string().uuid(),
  userId: z.string(),
  runnerName: z.string().optional(),
  runDate: z.string(), // ISO date string
  actualRunDate: z.string().optional(), // ISO date string - actual date when the run was conducted
  distanceKm: z.number().positive(),
  timeMinutes: z.number().int().positive().optional(),
  notes: NotesSchema,
  status: StatusEnum.default("completed"),
  recordedAt: z.string().datetime().optional(),
  changeLog: ChangeLogSchema,
});

export const RunUpdatedSchema = z.object({
  id: z.string().uuid(),
  instanceId: z.string().uuid(),
  userId: z.string(),
  runnerName: z.string().optional(),
  runDate: z.string().optional(),
  actualRunDate: z.string().optional(), // ISO date string - actual date when the run was conducted
  distanceKm: z.number().positive().optional(),
  timeMinutes: z.number().int().positive().optional(),
  notes: NotesSchema,
  status: StatusEnum.optional(),
  recordedAt: z.string().datetime().optional(),
  changeLog: ChangeLogSchema,
});

export const RunDeletedSchema = z.object({
  id: z.string().uuid(),
  instanceId: z.string().uuid(),
  userId: z.string(),
});

export type RunLogged = z.infer<typeof RunLoggedSchema>;
export type RunUpdated = z.infer<typeof RunUpdatedSchema>;
export type RunDeleted = z.infer<typeof RunDeletedSchema>;
