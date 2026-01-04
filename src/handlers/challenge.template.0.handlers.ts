import {
  ChallengeTemplateCreatedSchema,
  ChallengeTemplateDeletedSchema,
  ChallengeTemplateUpdatedSchema,
} from "../contracts/challenge.template.0";
import { pool } from "../db/pool";

/**
 * Handle challenge.template.created.0 event
 */
export async function handleChallengeTemplateCreated(payload: unknown, eventId: string) {
  const validated = ChallengeTemplateCreatedSchema.parse(payload);

  await pool`
    INSERT INTO challenge_template (
      id, flowcore_event_id, name, description, start_date, end_date,
      days, required_distances_km, full_distance_total_km,
      half_distance_total_km, theme_key, created_at, updated_at
    ) VALUES (
      ${validated.id},
      ${eventId},
      ${validated.name},
      ${validated.description},
      ${validated.startDate.split("T")[0]}::date,
      ${validated.endDate.split("T")[0]}::date,
      ${validated.days},
      ${validated.requiredDistancesKm}::numeric[],
      ${validated.fullDistanceTotalKm},
      ${validated.halfDistanceTotalKm},
      ${validated.themeKey},
      NOW(),
      NOW()
    )
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
    WHERE challenge_template.flowcore_event_id != EXCLUDED.flowcore_event_id
  `;
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

  // Use postgres template literal with SQL.unsafe for dynamic queries
  await pool.unsafe(
    `UPDATE challenge_template SET ${updateFields.join(", ")} WHERE id = $${updateValues.length - 1} AND flowcore_event_id != $${updateValues.length}`,
    updateValues as never[]
  );
}

/**
 * Handle challenge.template.deleted.0 event
 */
export async function handleChallengeTemplateDeleted(payload: unknown, eventId: string) {
  const validated = ChallengeTemplateDeletedSchema.parse(payload);

  await pool`
    DELETE FROM challenge_template
    WHERE id = ${validated.id}
  `;
}
