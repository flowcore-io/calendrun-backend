import { pool } from "../pool";

export async function getClubById(id: string) {
  const result = await pool`
    SELECT * FROM club
    WHERE id = ${id}
    LIMIT 1
  `;
  return result[0] ?? null;
}

export async function getClubByInviteToken(inviteToken: string) {
  const result = await pool`
    SELECT * FROM club
    WHERE invite_token = ${inviteToken}
    LIMIT 1
  `;
  return result[0] ?? null;
}

export async function getClubsByUserId(userId: string) {
  return pool`
    SELECT c.* FROM club c
    INNER JOIN club_membership cm ON c.id = cm.club_id
    WHERE cm.user_id = ${userId}
    ORDER BY c.created_at DESC
  `;
}
