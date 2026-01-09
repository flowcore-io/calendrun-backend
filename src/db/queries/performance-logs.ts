import { pool } from "../pool";
import { getTableName } from "../table-names";

export interface PerformanceLogFilters {
  userId: string;
  startDate?: string;
  endDate?: string;
  eventType?: "run.logged.0" | "run.updated.0" | "run.deleted.0";
  limit?: number;
  offset?: number;
}

export async function getPerformanceLogs(filters: PerformanceLogFilters) {
  const { userId, startDate, endDate, eventType, limit = 100, offset = 0 } = filters;
  const tableName = getTableName("performance_log");

  const conditions: string[] = [`user_id = $1`];
  const params: unknown[] = [userId];
  let paramIndex = 2;

  if (startDate) {
    conditions.push(`created_at >= $${paramIndex}::timestamp`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramIndex}::timestamp`);
    params.push(endDate);
    paramIndex++;
  }

  if (eventType) {
    conditions.push(`event_type = $${paramIndex}`);
    params.push(eventType);
    paramIndex++;
  }

  const whereClause = conditions.join(" AND ");
  const query = `
    SELECT * FROM ${tableName}
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex}
    OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  return pool.unsafe(query, params as never[]);
}

export async function getPerformanceLogsByPerformanceId(performanceId: string) {
  const tableName = getTableName("performance_log");
  return pool.unsafe(`
    SELECT * FROM ${tableName}
    WHERE performance_id = $1
    ORDER BY created_at DESC
  `, [performanceId]);
}
