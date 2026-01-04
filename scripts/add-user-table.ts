#!/usr/bin/env bun
/**
 * Migration Script: Add User Table
 *
 * Adds the user table to the existing PostgreSQL database without dropping other tables.
 * This is a safe migration that preserves all existing data.
 *
 * Usage:
 *   bun run scripts/add-user-table.ts
 *
 * Environment variables required:
 *   - DATABASE_URL
 */

import { pool } from "../src/db/pool";

/**
 * Add user table to database
 */
async function addUserTable() {
  console.log("🔄 Adding user table to database...");

  try {
    // Check if user table already exists
    const tableExists = await pool`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user'
      )
    `;

    if (tableExists[0]?.exists) {
      console.log("ℹ️  User table already exists, skipping creation");
      return;
    }

    // Create user table
    await pool.unsafe(`
      CREATE TABLE "user" (
        id VARCHAR(255) PRIMARY KEY,
        flowcore_event_id UUID UNIQUE,
        name VARCHAR(255),
        email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_user_id ON "user"(id);
      CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
    `);

    console.log("✅ User table created successfully");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Failed to add user table:", errorMessage);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
addUserTable().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
