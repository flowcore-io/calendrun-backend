#!/usr/bin/env bun
/**
 * Migration Script: Add actual_run_date Column
 *
 * Adds the actual_run_date column to performance and performance_log tables
 * and backfills it with the date portion of created_at for existing records.
 *
 * Usage:
 *   bun run scripts/add-actual-run-date.ts
 *
 * Environment variables required:
 *   - DATABASE_URL
 */

import { pool } from "../src/db/pool";

/**
 * Add actual_run_date column and backfill data
 */
async function addActualRunDate() {
  console.log("🔄 Adding actual_run_date column to performance tables...");

  try {
    // Check if column already exists in performance table
    const performanceColumnExists = await pool`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'performance'
        AND column_name = 'actual_run_date'
      )
    `;

    if (performanceColumnExists[0]?.exists) {
      console.log("ℹ️  actual_run_date column already exists in performance table");
    } else {
      // Add column to performance table
      await pool.unsafe(`
        ALTER TABLE performance
        ADD COLUMN actual_run_date DATE;
      `);
      console.log("✅ Added actual_run_date column to performance table");
    }

    // Check if column already exists in performance_log table
    const performanceLogColumnExists = await pool`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'performance_log'
        AND column_name = 'actual_run_date'
      )
    `;

    if (performanceLogColumnExists[0]?.exists) {
      console.log("ℹ️  actual_run_date column already exists in performance_log table");
    } else {
      // Add column to performance_log table
      await pool.unsafe(`
        ALTER TABLE performance_log
        ADD COLUMN actual_run_date DATE;
      `);
      console.log("✅ Added actual_run_date column to performance_log table");
    }

    // Backfill performance table: set actual_run_date to date portion of created_at where NULL
    console.log("🔄 Backfilling actual_run_date in performance table...");
    const performanceCountBefore = await pool`
      SELECT COUNT(*) as count FROM performance WHERE actual_run_date IS NULL
    `;
    await pool.unsafe(`
      UPDATE performance
      SET actual_run_date = DATE(created_at)
      WHERE actual_run_date IS NULL;
    `);
    const performanceCountAfter = await pool`
      SELECT COUNT(*) as count FROM performance WHERE actual_run_date IS NULL
    `;
    const performanceUpdated = Number(performanceCountBefore[0]?.count ?? 0) - Number(performanceCountAfter[0]?.count ?? 0);
    console.log(`✅ Backfilled ${performanceUpdated} records in performance table`);

    // Backfill performance_log table: set actual_run_date to date portion of created_at where NULL
    console.log("🔄 Backfilling actual_run_date in performance_log table...");
    const performanceLogCountBefore = await pool`
      SELECT COUNT(*) as count FROM performance_log WHERE actual_run_date IS NULL
    `;
    await pool.unsafe(`
      UPDATE performance_log
      SET actual_run_date = DATE(created_at)
      WHERE actual_run_date IS NULL;
    `);
    const performanceLogCountAfter = await pool`
      SELECT COUNT(*) as count FROM performance_log WHERE actual_run_date IS NULL
    `;
    const performanceLogUpdated = Number(performanceLogCountBefore[0]?.count ?? 0) - Number(performanceLogCountAfter[0]?.count ?? 0);
    console.log(`✅ Backfilled ${performanceLogUpdated} records in performance_log table`);

    console.log("✅ Migration completed successfully");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Failed to add actual_run_date column:", errorMessage);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
addActualRunDate().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});

