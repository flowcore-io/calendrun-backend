import { pool } from "../pool";

export async function getChallengeTemplateById(id: string) {
  const result = await pool`
    SELECT * FROM challenge_template
    WHERE id = ${id}
    LIMIT 1
  `;
  return result[0] ?? null;
}

export async function getAllChallengeTemplates() {
  return pool`
    SELECT * FROM challenge_template
    ORDER BY start_date DESC
  `;
}
