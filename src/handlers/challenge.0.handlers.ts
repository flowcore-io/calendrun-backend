import {
  ChallengeCompletedSchema,
  ChallengeStartedSchema,
  ChallengeUpdatedSchema,
} from "../contracts/challenge.0";
import { pool } from "../db/pool";
import { getTableName } from "../db/table-names";

/**
 * Handle challenge.started.0 event
 */
export async function handleChallengeStarted(payload: unknown, eventId: string) {
  const validated = ChallengeStartedSchema.parse(payload);
  const instanceTable = getTableName("challenge_instance");

  await pool.unsafe(
    `INSERT INTO ${instanceTable} (
      id, flowcore_event_id, template_id, user_id, variant,
      theme_key, status, joined_at, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      flowcore_event_id = EXCLUDED.flowcore_event_id,
      template_id = EXCLUDED.template_id,
      user_id = EXCLUDED.user_id,
      variant = EXCLUDED.variant,
      theme_key = EXCLUDED.theme_key,
      status = EXCLUDED.status,
      joined_at = EXCLUDED.joined_at,
      updated_at = NOW()
    WHERE ${instanceTable}.flowcore_event_id != EXCLUDED.flowcore_event_id`,
    [
      validated.id,
      eventId,
      validated.templateId,
      validated.userId,
      validated.variant,
      validated.themeKey,
      validated.status,
      validated.joinedAt,
    ]
  );
}

/**
 * Handle challenge.updated.0 event
 */
export async function handleChallengeUpdated(payload: unknown, eventId: string) {
  const validated = ChallengeUpdatedSchema.parse(payload);

  // Build update query dynamically
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];

  if (validated.templateId !== undefined) {
    updateFields.push(`template_id = $${updateValues.length + 1}`);
    updateValues.push(validated.templateId);
  }
  if (validated.variant !== undefined) {
    updateFields.push(`variant = $${updateValues.length + 1}`);
    updateValues.push(validated.variant);
  }
  if (validated.themeKey !== undefined) {
    updateFields.push(`theme_key = $${updateValues.length + 1}`);
    updateValues.push(validated.themeKey);
  }
  if (validated.status !== undefined) {
    updateFields.push(`status = $${updateValues.length + 1}`);
    updateValues.push(validated.status);
  }
  if (validated.totalCompletedKm !== undefined) {
    updateFields.push(`total_completed_km = $${updateValues.length + 1}`);
    updateValues.push(validated.totalCompletedKm);
  }
  if (validated.succeeded !== undefined) {
    updateFields.push(`succeeded = $${updateValues.length + 1}`);
    updateValues.push(validated.succeeded);
  }
  if (validated.completedAt !== undefined) {
    updateFields.push(`completed_at = $${updateValues.length + 1}`);
    updateValues.push(validated.completedAt);
  }
  if (validated.userId !== undefined) {
    updateFields.push(`user_id = $${updateValues.length + 1}`);
    updateValues.push(validated.userId);
  }

  if (updateFields.length === 0) {
    console.warn(`⚠️  No fields to update for challenge ${validated.id}`);
    return;
  }

  updateFields.push("updated_at = NOW()");
  updateValues.push(validated.id, eventId);

  const instanceTable = getTableName("challenge_instance");
  // Use postgres template literal with SQL.unsafe for dynamic queries
  await pool.unsafe(
    `UPDATE ${instanceTable} SET ${updateFields.join(", ")} WHERE id = $${updateValues.length - 1} AND flowcore_event_id != $${updateValues.length}`,
    updateValues as never[]
  );
}

/**
 * Handle challenge.completed.0 event
 */
export async function handleChallengeCompleted(payload: unknown, eventId: string) {
  const validated = ChallengeCompletedSchema.parse(payload);
  const instanceTable = getTableName("challenge_instance");

  await pool.unsafe(
    `UPDATE ${instanceTable}
    SET
      status = 'completed',
      total_completed_km = $1,
      succeeded = $2,
      completed_at = $3,
      updated_at = NOW()
    WHERE id = $4
      AND user_id = $5
      AND flowcore_event_id != $6`,
    [
      validated.totalCompletedKm,
      validated.succeeded,
      validated.completedAt,
      validated.id,
      validated.userId,
      eventId,
    ]
  );
}
