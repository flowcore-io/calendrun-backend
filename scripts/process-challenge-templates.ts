#!/usr/bin/env bun
/**
 * Script to manually process challenge template events from all time buckets
 *
 * This script fetches and processes all challenge.template.created.0 events
 * to populate the challenge_template table in PostgreSQL.
 *
 * Usage:
 *   bun run scripts/process-challenge-templates.ts
 *
 * Environment variables required:
 *   - DATABASE_URL
 *   - FLOWCORE_TENANT
 *   - FLOWCORE_DATA_CORE
 *   - FLOWCORE_API_KEY
 */

import { env } from "../src/env";
import { processEvent } from "../src/services/event-service";
import { getDataCoreId } from "../src/services/flowcore-client";
import { fetchEvents, getTimeBuckets } from "../src/services/flowcore-client";

/**
 * Process all challenge template events
 */
async function processAllChallengeTemplates() {
  console.log("🚀 Processing challenge template events...");
  console.log(`   Tenant: ${env.FLOWCORE_TENANT}`);
  console.log(`   Data Core: ${env.FLOWCORE_DATA_CORE}`);

  try {
    // Resolve datacore ID
    const dataCoreId = await getDataCoreId();
    console.log(`   Data Core ID: ${dataCoreId}\n`);

    // Get all time buckets for challenge template events
    console.log("📦 Fetching time buckets for challenge.template.created.0...");
    const timeBucketsResult = await getTimeBuckets(
      "challenge.template.0",
      "challenge.template.created.0"
    );

    if (!timeBucketsResult.timeBuckets || timeBucketsResult.timeBuckets.length === 0) {
      console.log("ℹ️  No time buckets found for challenge templates");
      return;
    }

    console.log(`📦 Found ${timeBucketsResult.timeBuckets.length} time buckets\n`);

    let totalProcessed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process each time bucket
    for (const timeBucket of timeBucketsResult.timeBuckets) {
      console.log(`📦 Processing time bucket: ${timeBucket}`);

      let cursor: string | undefined;
      let bucketProcessed = 0;
      let bucketSkipped = 0;
      let bucketErrors = 0;

      while (true) {
        try {
          const result = await fetchEvents(
            "challenge.template.0",
            "challenge.template.created.0",
            timeBucket,
            cursor,
            500
          );

          // Extract events array
          const events =
            (result as { events?: unknown[] }).events ??
            (result as { data?: unknown[] }).data ??
            [];

          if (!events || events.length === 0) {
            break;
          }

          for (const event of events) {
            // Extract event ID
            const eventId =
              (event as { eventId?: string; id?: string }).eventId ?? (event as { id: string }).id;

            if (!eventId) {
              console.warn("⚠️  Event missing ID, skipping");
              bucketSkipped++;
              continue;
            }

            try {
              // Extract payload
              const payload =
                (event as { payload?: unknown }).payload ??
                (event as { data?: unknown }).data ??
                event;

              await processEvent(
                {
                  eventId,
                  flowTypeName: "challenge.template.0",
                  eventTypeName: "challenge.template.created.0",
                  payload,
                  timeBucket,
                  createdAt:
                    (event as { createdAt?: string; validTime?: string }).createdAt ??
                    (event as { validTime?: string }).validTime ??
                    new Date().toISOString(),
                },
                "challenge.template.0",
                "challenge.template.created.0"
              );
              bucketProcessed++;
            } catch (error) {
              bucketErrors++;
              console.error(`   ❌ Failed to process event ${eventId}:`, error);
            }
          }

          // Check if there are more pages
          const nextCursor =
            (result as { nextCursor?: string }).nextCursor ??
            (result as { cursor?: string }).cursor;

          if (!nextCursor || events.length < 500) {
            break;
          }

          cursor = nextCursor;
        } catch (error) {
          console.error(`   ❌ Failed to fetch events for time bucket ${timeBucket}:`, error);
          break;
        }
      }

      if (bucketProcessed > 0 || bucketSkipped > 0 || bucketErrors > 0) {
        console.log(
          `   ✅ Processed: ${bucketProcessed}, Skipped: ${bucketSkipped}, Errors: ${bucketErrors}`
        );
      }

      totalProcessed += bucketProcessed;
      totalSkipped += bucketSkipped;
      totalErrors += bucketErrors;
    }

    console.log("\n✅ Finished processing challenge templates:");
    console.log(`   Processed: ${totalProcessed}`);
    console.log(`   Skipped: ${totalSkipped}`);
    console.log(`   Errors: ${totalErrors}`);
  } catch (error) {
    console.error("\n❌ Failed to process challenge templates:", error);
    process.exit(1);
  }
}

// Run script
processAllChallengeTemplates();
