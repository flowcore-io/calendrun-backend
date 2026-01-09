import { pool } from "../pool";
import { getTableName } from "../table-names";

export async function getClubById(id: string) {
  const clubTable = getTableName("club");
  const result = await pool.unsafe(`
    SELECT * FROM ${clubTable}
    WHERE id = $1
    LIMIT 1
  `, [id]);
  return result[0] ?? null;
}

export async function getClubByInviteToken(inviteToken: string) {
  const clubTable = getTableName("club");
  const result = await pool.unsafe(`
    SELECT * FROM ${clubTable}
    WHERE invite_token = $1
    LIMIT 1
  `, [inviteToken]);
  return result[0] ?? null;
}

export async function getClubsByUserId(userId: string) {
  const clubTable = getTableName("club");
  const membershipTable = getTableName("club_membership");
  return pool.unsafe(`
    SELECT c.* FROM ${clubTable} c
    INNER JOIN ${membershipTable} cm ON c.id = cm.club_id
    WHERE cm.user_id = $1
    ORDER BY c.created_at DESC
  `, [userId]);
}
