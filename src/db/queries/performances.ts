import { pool } from "../pool";

export async function getPerformancesByInstance(instanceId: string) {
  return pool`
    SELECT * FROM performance
    WHERE instance_id = ${instanceId}
    ORDER BY run_date DESC
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
