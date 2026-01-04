import { pool } from "../pool";

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

  let query = pool`
    SELECT * FROM performance_log
    WHERE user_id = ${userId}
  `;

  if (startDate) {
    query = pool`${query} AND created_at >= ${startDate}::timestamp`;
  }

  if (endDate) {
    query = pool`${query} AND created_at <= ${endDate}::timestamp`;
  }

  if (eventType) {
    query = pool`${query} AND event_type = ${eventType}`;
  }

  query = pool`
    ${query}
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return query;
}

export async function getPerformanceLogsByPerformanceId(performanceId: string) {
  return pool`
    SELECT * FROM performance_log
    WHERE performance_id = ${performanceId}
    ORDER BY created_at DESC
  `;
}
