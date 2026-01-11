import { UserCreatedSchema, UserUpdatedSchema } from "../contracts/user.0";
import { pool } from "../db/pool";
import { getTableName } from "../db/table-names";

/**
 * Handle user.created.0 event
 * This handles both new user creation and updates existing users
 */
export async function handleUserCreated(payload: unknown, eventId: string) {
  const validated = UserCreatedSchema.parse(payload);
  const userTable = getTableName("user");

  await pool.unsafe(
    `INSERT INTO "${userTable}" (
      id, flowcore_event_id, name, email, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, "${userTable}".name),
      email = COALESCE(EXCLUDED.email, "${userTable}".email),
      updated_at = NOW(),
      flowcore_event_id = EXCLUDED.flowcore_event_id
    WHERE "${userTable}".flowcore_event_id != EXCLUDED.flowcore_event_id`,
    [validated.id, eventId, validated.name ?? null, validated.email ?? null]
  );
}

/**
 * Handle user.updated.0 event
 */
export async function handleUserUpdated(payload: unknown, eventId: string) {
  const validated = UserUpdatedSchema.parse(payload);

  // Build update query dynamically
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];

  if (validated.name !== undefined) {
    updateFields.push(`name = $${updateValues.length + 1}`);
    updateValues.push(validated.name);
  }
  if (validated.email !== undefined) {
    updateFields.push(`email = $${updateValues.length + 1}`);
    updateValues.push(validated.email);
  }

  if (updateFields.length === 0) {
    console.warn(`⚠️  No fields to update for user ${validated.id}`);
    return;
  }

  updateFields.push("updated_at = NOW()");
  updateValues.push(validated.id, eventId);

  const userTable = getTableName("user");
  // Use postgres template literal with SQL.unsafe for dynamic queries
  await pool.unsafe(
    `UPDATE "${userTable}" SET ${updateFields.join(", ")} WHERE id = $${updateValues.length - 1} AND flowcore_event_id != $${updateValues.length}`,
    updateValues as never[]
  );
}
