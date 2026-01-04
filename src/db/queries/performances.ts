import { pool } from "../pool";

export async function getPerformancesByInstance(instanceId: string) {
  return pool`
    SELECT DISTINCT ON (user_id, run_date) *
    FROM performance
    WHERE instance_id = ${instanceId}
    ORDER BY user_id, run_date DESC, updated_at DESC
  `;
}

export async function getPerformanceById(id: string) {
  const result = await pool`
    SELECT * FROM performance
    WHERE id = ${id}
    LIMIT 1
  `;
  return result[0] ?? null;
}
