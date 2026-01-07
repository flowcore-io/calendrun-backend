import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialize read model schema (projection tables)
 * In an event-sourced system, these are just projections that can be rebuilt from events
 *
 * Only drops tables if RESET_DB=true environment variable is set (for development/testing)
 * In production, tables are created if they don't exist (safe for existing data)
 */
export async function initializeSchema() {
  console.log("🔄 Initializing read model schema...");

  try {
    const resetDb = process.env.RESET_DB === "true";

    if (resetDb) {
      console.log("⚠️  RESET_DB=true - Dropping existing tables (development mode)...");

      // Drop all tables first (CASCADE to handle dependencies)
      const tables = [
        "challenge_template",
        "challenge_instance",
        "club",
        "club_membership",
        "performance",
        "user",
      ];

      for (const table of tables) {
        try {
          // Use quoted identifier for reserved words like "user"
          await pool.unsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        } catch (error: unknown) {
          // Ignore errors if table doesn't exist
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes("does not exist")) {
            console.warn(`  Warning: Could not drop ${table}:`, errorMessage);
          }
        }
      }
    } else {
      console.log("ℹ️  Running in safe mode - tables will be created if they don't exist");
    }

    // Read and execute schema SQL
    const schemaPath = join(__dirname, "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    // Execute schema SQL - creates all projection tables if they don't exist
    // Uses CREATE TABLE IF NOT EXISTS, so it's safe for existing data
    await pool.unsafe(schema);

    console.log("✅ Read model schema initialized");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Schema initialization failed:", errorMessage);
    throw error;
  }
}
