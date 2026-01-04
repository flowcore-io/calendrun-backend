#!/usr/bin/env bun
/**
 * Migration Script: Ingest Existing Users
 *
 * Finds all unique user IDs from existing tables and ingests them as user.created.0 events
 * into Flowcore. This ensures all existing users are persisted in the user table.
 *
 * Usage:
 *   bun run scripts/ingest-existing-users.ts
 *
 * Environment variables required:
 *   - DATABASE_URL
 *   - FLOWCORE_TENANT
 *   - FLOWCORE_DATA_CORE (or FLOWCORE_DATA_CORE_ID)
 *   - FLOWCORE_API_KEY
 *   - FLOWCORE_INGESTION_BASE_URL (optional, defaults to https://webhook.api.flowcore.io)
 */

import { pool } from "../src/db/pool";
import { env } from "../src/env";
import { fetchEvents, getDataCoreId, getTimeBuckets } from "../src/services/flowcore-client";

interface UserInfo {
  userId: string;
  name: string | null;
  email: string | null;
}

/**
 * Find all unique user IDs from existing tables and Flowcore events
 */
async function findExistingUsers(dataCoreId: string): Promise<UserInfo[]> {
  console.log("🔍 Finding existing users from database...");

  const users = new Map<string, UserInfo>();

  // Get users from club_membership (has user_name)
  const memberships = await pool`
    SELECT DISTINCT user_id, user_name
    FROM club_membership
    WHERE user_id IS NOT NULL AND user_id != ''
  `;

  for (const membership of memberships) {
    const userId = membership.user_id as string;
    if (userId && typeof userId === "string" && userId.trim().length > 0) {
      if (!users.has(userId)) {
        users.set(userId, {
          userId,
          name: membership.user_name as string | null,
          email: null,
        });
      } else {
        // Update name if we have a better one
        const existing = users.get(userId);
        if (existing && !existing.name && membership.user_name) {
          existing.name = membership.user_name as string;
        }
      }
    }
  }

  // Get users from challenge_instance
  const instances = await pool`
    SELECT DISTINCT user_id
    FROM challenge_instance
    WHERE user_id IS NOT NULL AND user_id != ''
  `;

  for (const instance of instances) {
    const userId = instance.user_id as string;
    if (userId && typeof userId === "string" && userId.trim().length > 0) {
      if (!users.has(userId)) {
        users.set(userId, {
          userId,
          name: null,
          email: null,
        });
      }
    }
  }

  // Get users from performance table (has runner_name)
  const performances = await pool`
    SELECT DISTINCT user_id, runner_name
    FROM performance
    WHERE user_id IS NOT NULL AND user_id != ''
  `;

  for (const performance of performances) {
    const userId = performance.user_id as string;
    if (userId && typeof userId === "string" && userId.trim().length > 0) {
      if (!users.has(userId)) {
        users.set(userId, {
          userId,
          name: performance.runner_name as string | null,
          email: null,
        });
      } else {
        // Update name if we have a better one
        const existing = users.get(userId);
        if (existing && !existing.name && performance.runner_name) {
          existing.name = performance.runner_name as string;
        }
      }
    }
  }

  // Also get users from run.logged.0 events in Flowcore (to catch any not yet in DB)
  console.log("🔍 Fetching users from run.logged.0 events in Flowcore...");
  try {
    const timeBucketsResult = await getTimeBuckets("run.0", "run.logged.0");

    if (timeBucketsResult.timeBuckets && timeBucketsResult.timeBuckets.length > 0) {
      console.log(
        `   Found ${timeBucketsResult.timeBuckets.length} time buckets with run.logged.0 events`
      );

      for (const timeBucket of timeBucketsResult.timeBuckets) {
        let cursor: string | undefined;
        let processedInBucket = 0;

        while (true) {
          try {
            const result = await fetchEvents("run.0", "run.logged.0", timeBucket, cursor, 500);
            const events =
              (result as { events?: unknown[] }).events ??
              (result as { data?: unknown[] }).data ??
              [];

            if (!events || events.length === 0) {
              break;
            }

            for (const event of events) {
              const payload =
                (event as { payload?: unknown }).payload ??
                (event as { data?: unknown }).data ??
                event;

              // Extract userId and runnerName from event payload
              const userId =
                (payload as { userId?: string; user_id?: string }).userId ??
                (payload as { user_id?: string }).user_id;
              const runnerName =
                (payload as { runnerName?: string; runner_name?: string }).runnerName ??
                (payload as { runner_name?: string }).runner_name;

              if (userId && typeof userId === "string" && userId.trim().length > 0) {
                if (!users.has(userId)) {
                  users.set(userId, {
                    userId,
                    name:
                      runnerName && typeof runnerName === "string" && runnerName.trim().length > 0
                        ? runnerName.trim()
                        : null,
                    email: null,
                  });
                } else {
                  // Update name if we have a better one
                  const existing = users.get(userId);
                  if (
                    existing &&
                    !existing.name &&
                    runnerName &&
                    typeof runnerName === "string" &&
                    runnerName.trim().length > 0
                  ) {
                    existing.name = runnerName.trim();
                  }
                }
              }
              processedInBucket++;
            }

            const nextCursor =
              (result as { nextCursor?: string }).nextCursor ??
              (result as { cursor?: string }).cursor;
            if (!nextCursor || events.length < 500) {
              break;
            }
            cursor = nextCursor;
          } catch (error) {
            console.warn(`   ⚠️  Error fetching events from time bucket ${timeBucket}:`, error);
            break;
          }
        }

        if (processedInBucket > 0) {
          console.log(`   ✅ Processed ${processedInBucket} events from time bucket ${timeBucket}`);
        }
      }
    } else {
      console.log("   ℹ️  No time buckets found for run.logged.0 events");
    }
  } catch (error) {
    console.warn(
      "   ⚠️  Failed to fetch users from Flowcore events (continuing with DB users):",
      error
    );
  }

  // Get users from subscription
  const subscriptions = await pool`
    SELECT DISTINCT user_id
    FROM subscription
    WHERE user_id IS NOT NULL AND user_id != ''
  `;

  for (const subscription of subscriptions) {
    const userId = subscription.user_id as string;
    if (userId && typeof userId === "string" && userId.trim().length > 0) {
      if (!users.has(userId)) {
        users.set(userId, {
          userId,
          name: null,
          email: null,
        });
      }
    }
  }

  // Get users from discount_bundle
  const bundles = await pool`
    SELECT DISTINCT purchased_by
    FROM discount_bundle
    WHERE purchased_by IS NOT NULL AND purchased_by != ''
  `;

  for (const bundle of bundles) {
    const userId = bundle.purchased_by as string;
    if (userId && typeof userId === "string" && userId.trim().length > 0) {
      if (!users.has(userId)) {
        users.set(userId, {
          userId,
          name: null,
          email: null,
        });
      }
    }
  }

  // Get users from user_settings
  const settings = await pool`
    SELECT DISTINCT user_id
    FROM user_settings
    WHERE user_id IS NOT NULL AND user_id != ''
  `;

  for (const setting of settings) {
    const userId = setting.user_id as string;
    if (userId && typeof userId === "string" && userId.trim().length > 0) {
      if (!users.has(userId)) {
        users.set(userId, {
          userId,
          name: null,
          email: null,
        });
      }
    }
  }

  return Array.from(users.values());
}

/**
 * Build Flowcore ingestion URL
 */
function buildIngestionUrl(
  flowTypeName: string,
  eventTypeName: string,
  dataCoreId: string
): string {
  // Get base URL with proper fallback
  const baseUrl =
    (env.FLOWCORE_INGESTION_BASE_URL as string | undefined) ??
    (process.env.FLOWCORE_INGESTION_BASE_URL as string | undefined) ??
    "https://webhook.api.flowcore.io";
  const tenant = env.FLOWCORE_TENANT;
  const apiKey = env.FLOWCORE_API_KEY;

  // Ensure baseUrl is a valid URL string
  if (!baseUrl || typeof baseUrl !== "string") {
    throw new Error(`FLOWCORE_INGESTION_BASE_URL is not set or invalid: ${baseUrl}`);
  }

  const url = new URL(`/event/${tenant}/${dataCoreId}/${flowTypeName}/${eventTypeName}`, baseUrl);
  url.searchParams.set("key", apiKey);
  return url.toString();
}

/**
 * Emit user.created.0 event to Flowcore
 */
async function emitUserCreated(user: UserInfo, dataCoreId: string): Promise<void> {
  const url = buildIngestionUrl("user.0", "user.created.0", dataCoreId);

  // Build payload, ensuring we don't send empty strings (which would fail email validation)
  const payload: {
    id: string;
    name?: string;
    email?: string;
  } = {
    id: user.userId,
  };

  if (user.name && user.name.trim().length > 0) {
    payload.name = user.name.trim();
  }

  if (user.email && user.email.trim().length > 0) {
    // Validate email format before sending
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(user.email.trim())) {
      payload.email = user.email.trim();
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Flowcore ingestion failed: ${response.status} ${errorText}`);
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log("🚀 Starting user ingestion...");
  console.log(`   Tenant: ${env.FLOWCORE_TENANT}`);
  console.log(`   Data Core: ${env.FLOWCORE_DATA_CORE}`);

  try {
    // Resolve datacore ID
    const dataCoreId = await getDataCoreId();
    console.log(`   Data Core ID: ${dataCoreId}\n`);

    // Find all existing users (from DB and Flowcore events)
    const users = await findExistingUsers(dataCoreId);
    console.log(`📊 Found ${users.length} unique users\n`);

    if (users.length === 0) {
      console.log("ℹ️  No users found to ingest");
      return;
    }

    // Ingest users in batches
    const batchSize = 25; // Flowcore limit
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`📤 Ingesting batch ${Math.floor(i / batchSize) + 1} (${batch.length} users)...`);

      for (const user of batch) {
        try {
          if (!user.userId) {
            console.warn("   ⚠️  Skipping user with undefined userId:", user);
            continue;
          }
          await emitUserCreated(user, dataCoreId);
          successCount++;
          console.log(`   ✅ Ingested user: ${user.userId}${user.name ? ` (${user.name})` : ""}`);
        } catch (error) {
          errorCount++;
          console.error(`   ❌ Failed to ingest user ${user.userId}:`, error);
          if (error instanceof Error && error.message.includes("Invalid payload")) {
            console.error(
              "   📋 Payload was:",
              JSON.stringify(
                {
                  id: user.userId,
                  name: user.name ?? undefined,
                  email: user.email ?? undefined,
                },
                null,
                2
              )
            );
          }
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(
      `\n✅ User ingestion completed: ${successCount} succeeded${errorCount > 0 ? `, ${errorCount} errors` : ""}`
    );
    console.log("\n💡 Next steps:");
    console.log("   1. The backend event streamer will process these events");
    console.log("   2. Users will be populated in the PostgreSQL user table");
    console.log("   3. Club leaderboards will show full names");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
main();
