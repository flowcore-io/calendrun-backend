import {
  ChallengeTemplateCreatedSchema,
  ChallengeTemplateDeletedSchema,
  ChallengeTemplateUpdatedSchema,
} from "../contracts/challenge.template.0";
import { pool } from "../db/pool";
import { getTableName } from "../db/table-names";

/**
 * Handle challenge.template.created.0 event
 */
export async function handleChallengeTemplateCreated(payload: unknown, eventId: string) {
  const validated = ChallengeTemplateCreatedSchema.parse(payload);
  const templateTable = getTableName("challenge_template");

  await pool.unsafe(
    `INSERT INTO ${templateTable} (
      id, flowcore_event_id, name, description, start_date, end_date,
      days, required_distances_km, full_distance_total_km,
      half_distance_total_km, theme_key, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, $8::numeric[], $9, $10, $11, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      flowcore_event_id = EXCLUDED.flowcore_event_id,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      days = EXCLUDED.days,
      required_distances_km = EXCLUDED.required_distances_km,
      full_distance_total_km = EXCLUDED.full_distance_total_km,
      half_distance_total_km = EXCLUDED.half_distance_total_km,
      theme_key = EXCLUDED.theme_key,
      updated_at = NOW()
    WHERE ${templateTable}.flowcore_event_id != EXCLUDED.flowcore_event_id`,
    [
      validated.id,
      eventId,
      validated.name,
      validated.description,
      validated.startDate.split("T")[0],
      validated.endDate.split("T")[0],
      validated.days,
      validated.requiredDistancesKm,
      validated.fullDistanceTotalKm,
      validated.halfDistanceTotalKm,
      validated.themeKey,
    ]
  );
}

/**
 * Handle challenge.template.updated.0 event
 */
export async function handleChallengeTemplateUpdated(payload: unknown, eventId: string) {
  const validated = ChallengeTemplateUpdatedSchema.parse(payload);

  // Build update query dynamically
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];

  if (validated.name !== undefined) {
    updateFields.push(`name = $${updateValues.length + 1}`);
    updateValues.push(validated.name);
  }
  if (validated.description !== undefined) {
    updateFields.push(`description = $${updateValues.length + 1}`);
    updateValues.push(validated.description);
  }
  if (validated.startDate !== undefined) {
    updateFields.push(`start_date = $${updateValues.length + 1}::date`);
    updateValues.push(validated.startDate.split("T")[0]);
  }
  if (validated.endDate !== undefined) {
    updateFields.push(`end_date = $${updateValues.length + 1}::date`);
    updateValues.push(validated.endDate.split("T")[0]);
  }
  if (validated.days !== undefined) {
    updateFields.push(`days = $${updateValues.length + 1}`);
    updateValues.push(validated.days);
  }
  if (validated.requiredDistancesKm !== undefined) {
    updateFields.push(`required_distances_km = $${updateValues.length + 1}::numeric[]`);
    updateValues.push(validated.requiredDistancesKm);
  }
  if (validated.fullDistanceTotalKm !== undefined) {
    updateFields.push(`full_distance_total_km = $${updateValues.length + 1}`);
    updateValues.push(validated.fullDistanceTotalKm);
  }
  if (validated.halfDistanceTotalKm !== undefined) {
    updateFields.push(`half_distance_total_km = $${updateValues.length + 1}`);
    updateValues.push(validated.halfDistanceTotalKm);
  }
  if (validated.themeKey !== undefined) {
    updateFields.push(`theme_key = $${updateValues.length + 1}`);
    updateValues.push(validated.themeKey);
  }

  if (updateFields.length === 0) {
    return; // No updates to apply
  }

  updateFields.push("updated_at = NOW()");
  updateValues.push(validated.id, eventId);

  const templateTable = getTableName("challenge_template");
  // Use postgres template literal with SQL.unsafe for dynamic queries
  await pool.unsafe(
    `UPDATE ${templateTable} SET ${updateFields.join(", ")} WHERE id = $${updateValues.length - 1} AND flowcore_event_id != $${updateValues.length}`,
    updateValues as never[]
  );
}

/**
 * Handle challenge.template.deleted.0 event
 */
export async function handleChallengeTemplateDeleted(payload: unknown, eventId: string) {
  const validated = ChallengeTemplateDeletedSchema.parse(payload);
  const templateTable = getTableName("challenge_template");

  await pool.unsafe(
    `DELETE FROM ${templateTable}
    WHERE id = $1`,
    [validated.id]
  );
}
