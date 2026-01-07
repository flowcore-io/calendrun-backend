import { pool } from "../src/db/pool";

/**
 * Drop unused tables: discount_code, discount_bundle, subscription, user_settings
 * This script should be run manually after confirming these entities are no longer needed.
 */
async function dropUnusedTables() {
  console.log("🗑️  Dropping unused tables...");

  const tables = [
    "discount_code",
    "discount_bundle",
    "subscription",
    "user_settings",
  ];

  for (const table of tables) {
    try {
      await pool.unsafe(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      console.log(`✅ Dropped table: ${table}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to drop table ${table}:`, errorMessage);
    }
  }

  console.log("✅ Finished dropping unused tables");
  await pool.end();
}

dropUnusedTables().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});

