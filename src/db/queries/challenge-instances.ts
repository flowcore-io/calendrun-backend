import { pool } from "../pool";

export async function getChallengeInstanceById(id: string) {
  const result = await pool`
    SELECT * FROM challenge_instance
    WHERE id = ${id}
    LIMIT 1
  `;
  return result[0] ?? null;
}

export async function getChallengeInstancesByUserId(userId: string) {
  return pool`
    SELECT * FROM challenge_instance
    WHERE user_id = ${userId}
    ORDER BY joined_at DESC
  `;
}

export async function getChallengeInstancesByTemplateId(templateId: string) {
  return pool`
    SELECT * FROM challenge_instance
    WHERE template_id = ${templateId}
    ORDER BY joined_at DESC
  `;
}
