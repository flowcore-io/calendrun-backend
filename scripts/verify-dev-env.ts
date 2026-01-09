import { pool } from "../src/db/pool";
import { getTableName } from "../src/db/table-names";
import { env } from "../src/env";
import { getDataCoreId } from "../src/services/flowcore-client";

async function verifyDevEnvironment() {
  console.log("🔍 Verifying dev environment configuration...");
  console.log("");

  let allChecksPassed = true;

  // Check DEV_MODE
  if (!env.DEV_MODE) {
    console.log("❌ DEV_MODE is not enabled");
    console.log("   Set DEV_MODE=true in your .env.development file");
    allChecksPassed = false;
  } else {
    console.log("✅ DEV_MODE is enabled");
  }

  // Check TABLE_PREFIX
  const expectedPrefix = "dev_";
  if (env.TABLE_PREFIX !== expectedPrefix) {
    console.log(`⚠️  TABLE_PREFIX is "${env.TABLE_PREFIX}" (expected "${expectedPrefix}")`);
    console.log("   This will be auto-set to 'dev_' when DEV_MODE=true");
  } else {
    console.log(`✅ TABLE_PREFIX is "${env.TABLE_PREFIX}"`);
  }

  // Check that FLOWCORE_DATA_CORE is set to dev datacore when in dev mode
  if (env.DEV_MODE) {
    if (env.FLOWCORE_DATA_CORE === "calendrun") {
      console.log("❌ FLOWCORE_DATA_CORE is set to production datacore 'calendrun'");
      console.log("   Set FLOWCORE_DATA_CORE=calendrun-dev in your .env.development file");
      allChecksPassed = false;
    } else {
      console.log(`✅ FLOWCORE_DATA_CORE is "${env.FLOWCORE_DATA_CORE}" (dev datacore)`);
    }
  }

  // Check database connection
  try {
    await pool`SELECT 1`;
    console.log("✅ Database connection is valid");
  } catch (error) {
    console.log("❌ Database connection failed:", error);
    allChecksPassed = false;
  }

  // Check dev tables exist
  try {
    const testTable = getTableName("user");
    await pool.unsafe(`SELECT 1 FROM ${testTable} LIMIT 1`);
    console.log(`✅ Dev table "${testTable}" exists`);
  } catch (error) {
    console.log(`⚠️  Dev tables may not exist yet`);
    console.log("   Run 'bun run dev:migrate' to create dev tables");
  }

  // Check Flowcore datacore is accessible
  try {
    const dataCoreId = await getDataCoreId();
    console.log(`✅ Flowcore datacore is accessible (ID: ${dataCoreId})`);
  } catch (error) {
    console.log("❌ Flowcore datacore is not accessible:", error);
    console.log("   Run 'bun run dev:flowcore:setup' to set up the dev datacore");
    allChecksPassed = false;
  }

  console.log("");
  if (allChecksPassed) {
    console.log("✅ All checks passed! Dev environment is ready.");
    console.log("");
    console.log("⚠️  IMPORTANT: Flowcore events must be manually truncated in the Flowcore UI");
    console.log("   before running tests. There is no programmatic API for event truncation.");
  } else {
    console.log("❌ Some checks failed. Please fix the issues above.");
    process.exit(1);
  }
}

verifyDevEnvironment();
