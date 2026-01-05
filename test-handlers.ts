#!/usr/bin/env bun
/**
 * Simple test script to verify the run handlers work with actual_run_date
 */

import { pool } from "./src/db/pool";

// Test the handleRunLogged function
async function testHandleRunLogged() {
  console.log("🧪 Testing handleRunLogged with actualRunDate...");

  const testPayload = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    instanceId: "550e8400-e29b-41d4-a716-446655440001",
    userId: "test-user-id",
    runDate: "2025-01-15",
    actualRunDate: "2025-01-14",
    distanceKm: 10.5,
    timeMinutes: 45,
    notes: "Test run with actual date",
    status: "completed" as const,
  };

  const eventId = "550e8400-e29b-41d4-a716-446655440002";

  try {
    // Import the handler
    const { handleRunLogged } = await import("./src/handlers/run.0.handlers");

    await handleRunLogged(testPayload, eventId);
    console.log("✅ handleRunLogged test passed");

    // Verify the data was inserted correctly
    const result = await pool`
      SELECT id, run_date, actual_run_date, distance_km, status, created_at
      FROM performance WHERE id = ${testPayload.id}
    `;

    console.log("🔍 Query result count:", result.length);
    console.log("🔍 Full result:", result);

    if (result.length > 0) {
      const performance = result[0];
      console.log("📊 Performance record:", {
        id: performance.id,
        runDate: performance.runDate,
        actualRunDate: performance.actualRunDate,
        distanceKm: performance.distanceKm,
        status: performance.status,
        createdAt: performance.createdAt,
      });

      // Convert Date objects to date strings for comparison
      const actualRunDateStr = performance.actualRunDate ? performance.actualRunDate.toISOString().split('T')[0] : null;

      if (actualRunDateStr === "2025-01-14") {
        console.log("✅ actual_run_date correctly set to payload value");
      } else {
        console.log("❌ actual_run_date not set correctly:", actualRunDateStr);
      }
    } else {
      console.log("❌ Performance record not found");

      // Check if there are any records at all
      const allRecords = await pool`SELECT COUNT(*) as count FROM performance`;
      console.log("📊 Total performance records in DB:", allRecords[0]?.count);

      // Check recent records
      const recentRecords = await pool`SELECT id, created_at FROM performance ORDER BY created_at DESC LIMIT 5`;
      console.log("📊 Recent performance records:", recentRecords);
    }

    // Clean up test data
    await pool`DELETE FROM performance WHERE id = ${testPayload.id}`;
    await pool`DELETE FROM performance_log WHERE performance_id = ${testPayload.id}`;
    console.log("🧹 Cleaned up test data");

  } catch (error) {
    console.error("❌ handleRunLogged test failed:", error);
  }
}

// Test handleRunLogged without actualRunDate (should use created_at date)
async function testHandleRunLoggedWithoutActualRunDate() {
  console.log("🧪 Testing handleRunLogged without actualRunDate...");

  const testPayload = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    instanceId: "550e8400-e29b-41d4-a716-446655440004",
    userId: "test-user-id",
    runDate: "2025-01-15",
    distanceKm: 5.0,
    status: "completed" as const,
  };

  const eventId = "550e8400-e29b-41d4-a716-446655440005";

  try {
    const { handleRunLogged } = await import("./src/handlers/run.0.handlers");

    await handleRunLogged(testPayload, eventId);
    console.log("✅ handleRunLogged (no actualRunDate) test passed");

    // Verify the data was inserted correctly
    const result = await pool`
      SELECT * FROM performance WHERE id = ${testPayload.id}
    `;

    if (result.length > 0) {
      const performance = result[0];
      console.log("📊 Performance record:", {
        id: performance.id,
        runDate: performance.runDate,
        actualRunDate: performance.actualRunDate,
        createdAt: performance.createdAt,
      });

      // The actual_run_date should be set to the date portion of created_at
      const createdDateStr = performance.createdAt ? performance.createdAt.toISOString().split("T")[0] : null;
      const actualRunDateStr = performance.actualRunDate ? performance.actualRunDate.toISOString().split('T')[0] : null;

      if (actualRunDateStr === createdDateStr) {
        console.log("✅ actual_run_date correctly set to created_at date");
      } else {
        console.log("❌ actual_run_date not set correctly:", actualRunDateStr, "expected:", createdDateStr);
      }
    } else {
      console.log("❌ Performance record not found");
    }

    // Clean up test data
    await pool`DELETE FROM performance WHERE id = ${testPayload.id}`;
    await pool`DELETE FROM performance_log WHERE performance_id = ${testPayload.id}`;
    console.log("🧹 Cleaned up test data");

  } catch (error) {
    console.error("❌ handleRunLogged (no actualRunDate) test failed:", error);
  }
}

// Run tests
async function runTests() {
  try {
    await testHandleRunLogged();
    console.log();
    await testHandleRunLoggedWithoutActualRunDate();
    console.log("\n🎉 All tests completed!");
  } catch (error) {
    console.error("❌ Test runner failed:", error);
  } finally {
    await pool.end();
  }
}

runTests().catch(console.error);
