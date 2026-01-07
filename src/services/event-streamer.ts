import { env } from "../env";
import { processEvent } from "./event-service";
import {
  fetchEvents,
  getCurrentTimeBucket,
  getPreviousTimeBucket,
  getTimeBuckets,
} from "./flowcore-client";

// In-memory deduplication (max 10k events, then clears oldest half)
const processedEventIds = new Set<string>();
const MAX_PROCESSED_EVENTS = 10000;

// Track buckets that were processed with no new events (to skip reprocessing)
// Map: bucket -> timestamp of last check with no events
const emptyBuckets = new Map<string, number>();
const EMPTY_BUCKET_TTL = 5 * 60 * 1000; // Skip empty buckets for 5 minutes

/**
 * Clear oldest half of processed events when limit reached
 */
function cleanupProcessedEvents() {
  if (processedEventIds.size >= MAX_PROCESSED_EVENTS) {
    const eventsArray = Array.from(processedEventIds);
    const keepCount = Math.floor(MAX_PROCESSED_EVENTS / 2);
    processedEventIds.clear();
    for (const id of eventsArray.slice(-keepCount)) {
      processedEventIds.add(id);
    }
    console.log(`🧹 Cleaned up processed events (kept ${keepCount} most recent)`);
  }
}

/**
 * Clean up old empty bucket entries
 */
function cleanupEmptyBuckets() {
  const now = Date.now();
  for (const [bucket, timestamp] of emptyBuckets.entries()) {
    if (now - timestamp > EMPTY_BUCKET_TTL) {
      emptyBuckets.delete(bucket);
    }
  }
}

/**
 * Process events for a specific flow type and event type
 * Returns true if any events were processed, false otherwise
 */
async function processEventType(
  flowTypeName: string,
  eventTypeName: string,
  timeBucket: string
): Promise<boolean> {
  // Validate timeBucket is a non-empty string
  if (!timeBucket || typeof timeBucket !== "string") {
    console.warn(
      `⚠️  Skipping ${flowTypeName}/${eventTypeName} - invalid timeBucket: ${timeBucket}`
    );
    return false;
  }

  // Check if this event type/bucket combination was recently empty (skip if so)
  const bucketKey = `${flowTypeName}/${eventTypeName}/${timeBucket}`;
  const emptyTimestamp = emptyBuckets.get(bucketKey);
  if (emptyTimestamp && Date.now() - emptyTimestamp < EMPTY_BUCKET_TTL) {
    return false; // Skip recently empty bucket
  }

  let cursor: string | undefined;
  let totalProcessed = 0;
  let totalSkipped = 0;

  while (true) {
    try {
      const result = await fetchEvents(flowTypeName, eventTypeName, timeBucket, cursor, 500);

      // Extract events array (SDK might return events or data)
      const events =
        (result as { events?: unknown[] }).events ?? (result as { data?: unknown[] }).data ?? [];

      if (!events || events.length === 0) {
        break;
      }

      for (const event of events) {
        // Extract event ID (SDK might return id or eventId)
        const eventId =
          (event as { eventId?: string; id?: string }).eventId ?? (event as { id: string }).id;

        if (!eventId) {
          console.warn("⚠️  Event missing ID, skipping:", event);
          continue;
        }

        // Check deduplication
        if (processedEventIds.has(eventId)) {
          totalSkipped++;
          continue;
        }

        try {
          // Extract payload (SDK might return payload or data)
          const payload =
            (event as { payload?: unknown }).payload ?? (event as { data?: unknown }).data ?? event;

          await processEvent(
            {
              eventId,
              flowTypeName,
              eventTypeName,
              payload,
              timeBucket,
              createdAt:
                (event as { createdAt?: string; validTime?: string }).createdAt ??
                (event as { validTime?: string }).validTime ??
                new Date().toISOString(),
            },
            flowTypeName,
            eventTypeName
          );
          processedEventIds.add(eventId);
          totalProcessed++;
          cleanupProcessedEvents();
        } catch (error) {
          console.error(
            `❌ Failed to process event ${eventId} (${flowTypeName}/${eventTypeName}):`,
            error
          );
          // Continue processing other events
        }
      }

      // Check if there are more pages
      const nextCursor =
        (result as { nextCursor?: string }).nextCursor ?? (result as { cursor?: string }).cursor;

      if (!nextCursor || events.length < 500) {
        break;
      }

      cursor = nextCursor;
    } catch (error) {
      // Extract error details (SDK may nest status/code in body property)
      const errorObj = error as {
        status?: number;
        code?: string;
        body?: { status?: number; code?: string };
      };
      const errorStatus = errorObj.status ?? errorObj.body?.status;
      const errorCode = errorObj.code ?? errorObj.body?.code;
      const errorString = String(error);

      // Check if it's a 401 Unauthorized error (likely missing event type or permissions)
      const isUnauthorized =
        errorStatus === 401 ||
        errorCode === "UNAUTHORIZED" ||
        errorString.includes("401") ||
        errorString.includes("UNAUTHORIZED");

      // Check if it's a 403 Forbidden error (IAM permissions issue)
      const isForbidden =
        errorStatus === 403 ||
        errorCode === "FORBIDDEN" ||
        errorString.includes("403") ||
        errorString.includes("FORBIDDEN") ||
        errorString.includes("IAM validation failed");

      // Check if it's a 422 Unprocessable Content error (likely invalid parameters)
      const isUnprocessable =
        errorStatus === 422 ||
        errorCode === "UNPROCESSABLE_CONTENT" ||
        errorString.includes("422") ||
        errorString.includes("UNPROCESSABLE");

      if (isUnauthorized) {
        // Silently skip - event type may not exist or API key lacks permissions
        // Only log once per event type to reduce noise
        if (totalProcessed === 0 && totalSkipped === 0) {
          console.log(
            `ℹ️  Skipping ${flowTypeName}/${eventTypeName} at ${timeBucket} (unauthorized - may not exist or lack permissions)`
          );
        }
        return false; // Exit early, don't break (which would retry)
      }

      if (isForbidden) {
        // Silently skip - API key lacks IAM permissions for this event type
        // Only log once per event type to reduce noise
        if (totalProcessed === 0 && totalSkipped === 0) {
          console.log(
            `ℹ️  Skipping ${flowTypeName}/${eventTypeName} at ${timeBucket} (forbidden - API key lacks IAM permissions)`
          );
        }
        return false; // Exit early, don't break (which would retry)
      }

      if (isUnprocessable) {
        // Invalid request parameters - likely timeBucket is invalid/undefined
        // Only log once per event type to reduce noise
        if (totalProcessed === 0 && totalSkipped === 0) {
          console.warn(
            `⚠️  Skipping ${flowTypeName}/${eventTypeName} at ${timeBucket} (unprocessable - invalid parameters, likely missing timeBucket)`
          );
        }
        return false; // Exit early, don't break (which would retry)
      }

      // For other errors, log and break
      console.error(
        `❌ Failed to fetch events for ${flowTypeName}/${eventTypeName} at ${timeBucket}:`,
        error
      );
      break;
    }
  }

  // Only log if we processed events or if this is the first check for this bucket
  const wasEmpty = emptyBuckets.has(bucketKey);
  
  if (totalProcessed > 0) {
    console.log(
      `✅ Processed ${flowTypeName}/${eventTypeName} at ${timeBucket}: ${totalProcessed} processed, ${totalSkipped} skipped`
    );
    // Remove from empty buckets if we found events
    emptyBuckets.delete(bucketKey);
  } else if (totalSkipped > 0 && !wasEmpty) {
    // Only log skipped events on first empty check
    console.log(
      `ℹ️  No new events for ${flowTypeName}/${eventTypeName} at ${timeBucket} (${totalSkipped} already processed)`
    );
    emptyBuckets.set(bucketKey, Date.now());
  }
  
  cleanupEmptyBuckets();
  
  return totalProcessed > 0;
}

/**
 * Process all event types for a time bucket
 * Returns true if any events were processed, false otherwise
 */
async function processTimeBucket(timeBucket: string): Promise<boolean> {
  // Validate timeBucket is a non-empty string
  if (!timeBucket || typeof timeBucket !== "string") {
    console.warn(`⚠️  Skipping processTimeBucket - invalid timeBucket: ${timeBucket}`);
    return false;
  }
  
  let hasNewEvents = false;
  const eventTypes = [
    // Run events
    { flowType: "run.0", eventType: "run.logged.0" },
    { flowType: "run.0", eventType: "run.updated.0" },
    { flowType: "run.0", eventType: "run.deleted.0" },
    // Challenge events
    { flowType: "challenge.0", eventType: "challenge.started.0" },
    { flowType: "challenge.0", eventType: "challenge.updated.0" },
    { flowType: "challenge.0", eventType: "challenge.completed.0" },
    // Challenge template events
    {
      flowType: "challenge.template.0",
      eventType: "challenge.template.created.0",
    },
    {
      flowType: "challenge.template.0",
      eventType: "challenge.template.updated.0",
    },
    {
      flowType: "challenge.template.0",
      eventType: "challenge.template.deleted.0",
    },
    // Club events
    { flowType: "club.0", eventType: "club.created.0" },
    { flowType: "club.0", eventType: "club.updated.0" },
    { flowType: "club.0", eventType: "club.member.joined.0" },
    { flowType: "club.0", eventType: "club.member.left.0" },
    // User events
    { flowType: "user.0", eventType: "user.created.0" },
    { flowType: "user.0", eventType: "user.updated.0" },
  ];

  for (const { flowType, eventType } of eventTypes) {
    const processed = await processEventType(flowType, eventType, timeBucket);
    if (processed) {
      hasNewEvents = true;
    }
  }
  
  return hasNewEvents;
}

/**
 * Process last N time buckets (for catch-up on startup)
 */
export async function processLastTimeBuckets(count = 3) {
  console.log(`🔄 Processing last ${count} time buckets...`);

  try {
    // Get available time buckets for one event type (they should be similar across types)
    const timeBucketsResult = await getTimeBuckets(
      "run.0",
      "run.logged.0",
      undefined,
      undefined,
      count
    );

    // Handle different possible response structures
    let timeBuckets: string[] = [];

    if (Array.isArray(timeBucketsResult)) {
      // If result is directly an array of strings
      timeBuckets = timeBucketsResult.filter((tb): tb is string => typeof tb === "string");
    } else if (timeBucketsResult && typeof timeBucketsResult === "object") {
      // Try different property names
      const bucketsArray =
        (timeBucketsResult as { timeBuckets?: unknown[] }).timeBuckets ??
        (timeBucketsResult as { buckets?: unknown[] }).buckets ??
        (timeBucketsResult as { data?: unknown[] }).data ??
        [];

      // Extract time bucket strings from array
      for (const bucket of bucketsArray) {
        if (typeof bucket === "string") {
          timeBuckets.push(bucket);
        } else if (bucket && typeof bucket === "object") {
          const tb =
            (bucket as { timeBucket?: string }).timeBucket ??
            (bucket as { bucket?: string }).bucket ??
            (bucket as { name?: string }).name ??
            (bucket as { value?: string }).value;
          if (typeof tb === "string") {
            timeBuckets.push(tb);
          }
        }
      }
    }

    // Debug: log the structure if no buckets found
    if (timeBuckets.length === 0 && timeBucketsResult) {
      console.warn(
        "⚠️  Could not extract time buckets from response structure:",
        JSON.stringify(timeBucketsResult).substring(0, 200)
      );
    }

    if (timeBuckets.length === 0) {
      console.log("ℹ️  No time buckets found");
      return;
    }

    const buckets = timeBuckets.slice(-count);
    console.log(`📦 Found ${buckets.length} time buckets to process`);

    for (const bucket of buckets) {
      if (!bucket) {
        console.warn("⚠️  Skipping undefined time bucket");
        continue;
      }
      console.log(`📦 Processing time bucket: ${bucket}`);
      await processTimeBucket(bucket);
    }

    console.log(`✅ Finished processing last ${count} time buckets`);
  } catch (error) {
    console.error("❌ Failed to process last time buckets:", error);
  }
}

/**
 * Start polling loop
 */
export async function startPolling() {
  console.log(`🚀 Starting event polling (interval: ${env.POLL_INTERVAL}s)...`);

  let lastProcessedBucket: string | null = null;

  const poll = async () => {
    try {
      const currentBucket = getCurrentTimeBucket();
      const previousBucket = getPreviousTimeBucket();

      // If bucket changed, process previous bucket completely (final check)
      if (lastProcessedBucket && lastProcessedBucket !== currentBucket) {
        console.log(`📦 Bucket changed from ${lastProcessedBucket} to ${currentBucket}, finalizing previous bucket`);
        await processTimeBucket(lastProcessedBucket);
      }

      // Process current bucket (always check for new events)
      const currentHasEvents = await processTimeBucket(currentBucket);
      
      // Only process previous bucket if current bucket has new events or bucket just changed
      // This reduces unnecessary API calls when nothing is happening
      if (currentHasEvents || (lastProcessedBucket && lastProcessedBucket !== currentBucket)) {
        await processTimeBucket(previousBucket);
      }

      lastProcessedBucket = currentBucket;
    } catch (error) {
      console.error("❌ Polling error:", error);
    }
  };

  // Initial poll
  await poll();

  // Set up interval
  setInterval(poll, env.POLL_INTERVAL * 1000);
}
