import { env } from "../env";

/**
 * Get table name with optional prefix based on DEV_MODE
 * @param baseName - Base table name (e.g., "challenge_instance")
 * @returns Prefixed table name (e.g., "dev_challenge_instance" in dev mode) or original name
 */
export function getTableName(baseName: string): string {
  const prefix = env.TABLE_PREFIX || "";
  return prefix ? `${prefix}${baseName}` : baseName;
}

/**
 * Get all table names used in the application
 * Useful for migrations and cleanup operations
 */
export const TABLE_NAMES = {
  challengeTemplate: "challenge_template",
  challengeInstance: "challenge_instance",
  club: "club",
  clubMembership: "club_membership",
  performance: "performance",
  user: "user",
  performanceLog: "performance_log",
} as const;

/**
 * Get prefixed table name for a given table key
 * @param tableKey - Key from TABLE_NAMES object
 * @returns Prefixed table name
 */
export function getTable(tableKey: keyof typeof TABLE_NAMES): string {
  return getTableName(TABLE_NAMES[tableKey]);
}
