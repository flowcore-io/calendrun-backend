import {
  ClubCreatedSchema,
  ClubMemberJoinedSchema,
  ClubMemberLeftSchema,
  ClubUpdatedSchema,
} from "../contracts/club.0";
import { pool } from "../db/pool";
import { getTableName } from "../db/table-names";

/**
 * Handle club.created.0 event
 */
export async function handleClubCreated(payload: unknown, eventId: string) {
  const validated = ClubCreatedSchema.parse(payload);
  const clubTable = getTableName("club");

  await pool.unsafe(
    `INSERT INTO ${clubTable} (
      id, flowcore_event_id, name, description, invite_token,
      logo_url, welcome_text, short_description, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      flowcore_event_id = EXCLUDED.flowcore_event_id,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      invite_token = EXCLUDED.invite_token,
      logo_url = EXCLUDED.logo_url,
      welcome_text = EXCLUDED.welcome_text,
      short_description = EXCLUDED.short_description,
      updated_at = EXCLUDED.updated_at
    WHERE ${clubTable}.flowcore_event_id != EXCLUDED.flowcore_event_id`,
    [
      validated.id,
      eventId,
      validated.name,
      validated.description ?? null,
      validated.inviteToken,
      validated.logoUrl ?? null,
      validated.welcomeText ? JSON.stringify(validated.welcomeText) : null,
      validated.shortDescription ? JSON.stringify(validated.shortDescription) : null,
    ]
  );
}

/**
 * Handle club.updated.0 event
 */
export async function handleClubUpdated(payload: unknown, eventId: string) {
  const validated = ClubUpdatedSchema.parse(payload);

  const updates: string[] = [];
  const values: unknown[] = [eventId, validated.id];

  if (validated.name !== undefined) {
    updates.push(`name = $${values.length + 1}`);
    values.push(validated.name);
  }
  if (validated.description !== undefined) {
    updates.push(`description = $${values.length + 1}`);
    values.push(validated.description);
  }
  if (validated.inviteToken !== undefined) {
    updates.push(`invite_token = $${values.length + 1}`);
    values.push(validated.inviteToken);
  }
  if (validated.logoUrl !== undefined) {
    updates.push(`logo_url = $${values.length + 1}`);
    values.push(validated.logoUrl);
  }
  if (validated.welcomeText !== undefined) {
    updates.push(`welcome_text = $${values.length + 1}`);
    values.push(JSON.stringify(validated.welcomeText));
  }
  if (validated.shortDescription !== undefined) {
    updates.push(`short_description = $${values.length + 1}`);
    values.push(JSON.stringify(validated.shortDescription));
  }

  if (updates.length === 0) {
    console.warn(`⚠️  No fields to update for club ${validated.id}`);
    return;
  }

  updates.push("updated_at = NOW()");

  const clubTable = getTableName("club");
  await pool.unsafe(
    `UPDATE ${clubTable} SET ${updates.join(", ")} WHERE id = $${values.length - 1} AND flowcore_event_id != $${values.length}`,
    values as never[]
  );
}

/**
 * Handle club.member.joined.0 event
 */
export async function handleClubMemberJoined(payload: unknown, eventId: string) {
  const validated = ClubMemberJoinedSchema.parse(payload);

  // If userName is not provided, look it up from the user table
  let userName = validated.userName;
  if (!userName) {
    const userTable = getTableName("user");
    const userResult = await pool.unsafe(
      `SELECT name FROM ${userTable}
      WHERE id = $1
      LIMIT 1`,
      [validated.userId]
    );
    if (userResult.length > 0 && userResult[0]?.name) {
      userName = userResult[0].name;
    }
  }

  const membershipTable = getTableName("club_membership");
  await pool.unsafe(
    `INSERT INTO ${membershipTable} (
      id, flowcore_event_id, club_id, user_id, user_name,
      role, joined_at, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      flowcore_event_id = EXCLUDED.flowcore_event_id,
      club_id = EXCLUDED.club_id,
      user_id = EXCLUDED.user_id,
      user_name = EXCLUDED.user_name,
      role = EXCLUDED.role,
      joined_at = EXCLUDED.joined_at,
      updated_at = EXCLUDED.updated_at
    WHERE ${membershipTable}.flowcore_event_id != EXCLUDED.flowcore_event_id`,
    [
      validated.id,
      eventId,
      validated.clubId,
      validated.userId,
      userName ?? null,
      validated.role,
      validated.joinedAt,
    ]
  );
}

/**
 * Handle club.member.left.0 event
 */
export async function handleClubMemberLeft(payload: unknown, eventId: string) {
  const validated = ClubMemberLeftSchema.parse(payload);
  const membershipTable = getTableName("club_membership");

  await pool.unsafe(
    `DELETE FROM ${membershipTable}
    WHERE club_id = $1
      AND user_id = $2
      AND flowcore_event_id != $3`,
    [validated.clubId, validated.userId, eventId]
  );
}
