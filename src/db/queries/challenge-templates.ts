import { pool } from "../pool";
import { getTableName } from "../table-names";

export async function getChallengeTemplateById(id: string) {
  const tableName = getTableName("challenge_template");
  const result = await pool.unsafe(`
    SELECT * FROM ${tableName}
    WHERE id = $1
    LIMIT 1
  `, [id]);
  return result[0] ?? null;
}

export async function getAllChallengeTemplates() {
  const tableName = getTableName("challenge_template");
  return pool.unsafe(`
    SELECT * FROM ${tableName}
    ORDER BY start_date DESC
  `);
}
