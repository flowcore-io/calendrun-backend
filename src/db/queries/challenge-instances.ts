import { pool } from "../pool";
import { getTableName } from "../table-names";

export async function getChallengeInstanceById(id: string) {
  const tableName = getTableName("challenge_instance");
  const result = await pool.unsafe(`
    SELECT * FROM ${tableName}
    WHERE id = $1
    LIMIT 1
  `, [id]);
  return result[0] ?? null;
}

export async function getChallengeInstancesByUserId(userId: string) {
  const tableName = getTableName("challenge_instance");
  return pool.unsafe(`
    SELECT * FROM ${tableName}
    WHERE user_id = $1
    ORDER BY joined_at DESC
  `, [userId]);
}

export async function getChallengeInstancesByTemplateId(templateId: string) {
  const tableName = getTableName("challenge_instance");
  return pool.unsafe(`
    SELECT * FROM ${tableName}
    WHERE template_id = $1
    ORDER BY joined_at DESC
  `, [templateId]);
}
