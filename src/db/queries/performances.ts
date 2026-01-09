import { pool } from "../pool";
import { getTableName } from "../table-names";

export async function getPerformancesByInstance(instanceId: string) {
  const tableName = getTableName("performance");
  return pool.unsafe(`
    SELECT DISTINCT ON (user_id, run_date) *
    FROM ${tableName}
    WHERE instance_id = $1
    ORDER BY user_id, run_date DESC, updated_at DESC
  `, [instanceId]);
}

export async function getPerformanceById(id: string) {
  const tableName = getTableName("performance");
  const result = await pool.unsafe(`
    SELECT * FROM ${tableName}
    WHERE id = $1
    LIMIT 1
  `, [id]);
  return result[0] ?? null;
}
