import { pool } from "../pool";

export async function getUserSettings(userId: string) {
  const result = await pool`
    SELECT * FROM user_settings
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  return result[0] ?? null;
}
