import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env";
import { pool } from "./pool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate dev schema SQL by prefixing all table names with dev_
 * Also prefixes index names to avoid conflicts
 */
function generateDevSchema(baseSchema: string, prefix: string): string {
  let devSchema = baseSchema;

  // Replace table names with prefixed versions
  const tableReplacements: Array<[RegExp, string]> = [
    // CREATE TABLE statements
    [/CREATE TABLE IF NOT EXISTS (challenge_template)/g, `CREATE TABLE IF NOT EXISTS ${prefix}$1`],
    [/CREATE TABLE IF NOT EXISTS (challenge_instance)/g, `CREATE TABLE IF NOT EXISTS ${prefix}$1`],
    [/CREATE TABLE IF NOT EXISTS (club)/g, `CREATE TABLE IF NOT EXISTS ${prefix}$1`],
    [/CREATE TABLE IF NOT EXISTS (club_membership)/g, `CREATE TABLE IF NOT EXISTS ${prefix}$1`],
    [/CREATE TABLE IF NOT EXISTS (performance)/g, `CREATE TABLE IF NOT EXISTS ${prefix}$1`],
    [/CREATE TABLE IF NOT EXISTS "user"/g, `CREATE TABLE IF NOT EXISTS "${prefix}user"`],
    [/CREATE TABLE IF NOT EXISTS (performance_log)/g, `CREATE TABLE IF NOT EXISTS ${prefix}$1`],
    // DROP TABLE statements
    [/DROP TABLE IF EXISTS "(challenge_template)"/g, `DROP TABLE IF EXISTS "${prefix}$1"`],
    [/DROP TABLE IF EXISTS "(challenge_instance)"/g, `DROP TABLE IF EXISTS "${prefix}$1"`],
    [/DROP TABLE IF EXISTS "(club)"/g, `DROP TABLE IF EXISTS "${prefix}$1"`],
    [/DROP TABLE IF EXISTS "(club_membership)"/g, `DROP TABLE IF EXISTS "${prefix}$1"`],
    [/DROP TABLE IF EXISTS "(performance)"/g, `DROP TABLE IF EXISTS "${prefix}$1"`],
    [/DROP TABLE IF EXISTS "user"/g, `DROP TABLE IF EXISTS "${prefix}user"`],
    [/DROP TABLE IF EXISTS "(performance_log)"/g, `DROP TABLE IF EXISTS "${prefix}$1"`],
    // Index names - prefix them too
    [/CREATE INDEX IF NOT EXISTS (idx_\w+)/g, `CREATE INDEX IF NOT EXISTS ${prefix}$1`],
    // Table references in indexes (ON table_name)
    [/ON challenge_instance\(/g, `ON ${prefix}challenge_instance(`],
    [/ON club\(/g, `ON ${prefix}club(`],
    [/ON club_membership\(/g, `ON ${prefix}club_membership(`],
    [/ON performance\(/g, `ON ${prefix}performance(`],
    [/ON "user"\(/g, `ON "${prefix}user"(`],
    [/ON performance_log\(/g, `ON ${prefix}performance_log(`],
  ];

  for (const [pattern, replacement] of tableReplacements) {
    devSchema = devSchema.replace(pattern, replacement);
  }

  return devSchema;
}

/**
 * Initialize dev tables schema (dev_ prefixed tables)
 * Creates dev_* tables if they don't exist
 */
export async function initializeDevSchema() {
  if (!env.DEV_MODE) {
    return; // Skip if not in dev mode
  }

  const prefix = env.TABLE_PREFIX || "dev_";
  if (!prefix) {
    console.log("ℹ️  No table prefix configured, skipping dev table creation");
    return;
  }

  console.log(`🔄 Initializing dev schema with prefix "${prefix}"...`);

  try {
    // Read base schema
    const schemaPath = join(__dirname, "schema.sql");
    const baseSchema = readFileSync(schemaPath, "utf-8");

    // Generate dev schema with prefix
    const devSchema = generateDevSchema(baseSchema, prefix);

    // Execute dev schema SQL - creates all dev_* projection tables if they don't exist
    await pool.unsafe(devSchema);

    console.log(`✅ Dev schema initialized with prefix "${prefix}"`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Dev schema initialization failed:", errorMessage);
    throw error;
  }
}

/**
 * Reset dev tables (truncate all dev_* tables)
 * Useful for cleaning up test data
 */
export async function resetDevTables() {
  if (!env.DEV_MODE) {
    throw new Error("Cannot reset dev tables when DEV_MODE is not enabled");
  }

  const prefix = env.TABLE_PREFIX || "dev_";
  if (!prefix) {
    throw new Error("No table prefix configured");
  }

  console.log(`🧹 Resetting dev tables with prefix "${prefix}"...`);

  try {
    // List of tables to truncate (in dependency order)
    const tables = [
      `${prefix}performance_log`,
      `${prefix}performance`,
      `${prefix}club_membership`,
      `${prefix}club`,
      `${prefix}challenge_instance`,
      `${prefix}challenge_template`,
      `"${prefix}user"`,
    ];

    for (const table of tables) {
      try {
        await pool.unsafe(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`  ✓ Truncated ${table}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Ignore errors if table doesn't exist
        if (!errorMessage.includes("does not exist")) {
          console.warn(`  ⚠️  Could not truncate ${table}:`, errorMessage);
        }
      }
    }

    console.log("✅ Dev tables reset complete");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Dev table reset failed:", errorMessage);
    throw error;
  }
}
