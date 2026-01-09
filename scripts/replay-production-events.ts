import {
    DataCoreFetchCommand,
    EventsFetchCommand,
    EventsFetchTimeBucketsByNamesCommand,
    FlowcoreClient,
} from "@flowcore/sdk";
import { env } from "../src/env";

const client = new FlowcoreClient({
  apiKey: env.FLOWCORE_API_KEY,
  retry: {
    delay: 250,
    maxRetries: 3,
  },
});

const TENANT = env.FLOWCORE_TENANT;
// Production datacore name (hardcoded for safety)
const PROD_DATA_CORE_NAME = "calendrun";
// Dev datacore name from FLOWCORE_DATA_CORE (should be set to dev datacore in dev mode)
const DEV_DATA_CORE_NAME = env.FLOWCORE_DATA_CORE || "calendrun-dev";
const FLOWCORE_INGESTION_BASE_URL = "https://webhook.api.flowcore.io";

// All flow types and event types to replay
const FLOW_TYPES = [
  {
    name: "run.0",
    eventTypes: ["run.logged.0", "run.updated.0", "run.deleted.0"],
  },
  {
    name: "challenge.0",
    eventTypes: ["challenge.started.0", "challenge.updated.0", "challenge.completed.0"],
  },
  {
    name: "challenge.template.0",
    eventTypes: [
      "challenge.template.created.0",
      "challenge.template.updated.0",
      "challenge.template.deleted.0",
    ],
  },
  {
    name: "club.0",
    eventTypes: [
      "club.created.0",
      "club.updated.0",
      "club.member.joined.0",
      "club.member.left.0",
    ],
  },
  {
    name: "user.0",
    eventTypes: ["user.created.0", "user.updated.0"],
  },
];

interface ReplayOptions {
  dryRun?: boolean;
  fromDate?: Date;
  toDate?: Date;
  flowTypes?: string[];
  eventTypes?: string[];
  maxEvents?: number;
}

/**
 * Format time bucket (YYYYMMDDHH0000)
 */
function formatTimeBucket(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  return `${year}${month}${day}${hour}0000`;
}

/**
 * Get time buckets for a date range
 */
function getTimeBucketsForRange(fromDate: Date, toDate: Date): string[] {
  const buckets: string[] = [];
  const current = new Date(fromDate);
  current.setUTCHours(current.getUTCHours(), 0, 0, 0);

  while (current <= toDate) {
    buckets.push(formatTimeBucket(current));
    current.setUTCHours(current.getUTCHours() + 1);
  }

  return buckets;
}

/**
 * Ingest event to dev datacore using ingestion API
 */
async function ingestEventToDev(
  devDataCoreId: string,
  flowTypeName: string,
  eventTypeName: string,
  payload: unknown
): Promise<void> {
  const url = new URL(
    `/event/${TENANT}/${devDataCoreId}/${flowTypeName}/${eventTypeName}`,
    FLOWCORE_INGESTION_BASE_URL
  );
  url.searchParams.set("key", env.FLOWCORE_API_KEY);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to ingest event: ${response.status} ${errorText}`);
  }
}

/**
 * Replay events from production to dev datacore
 */
async function replayEvents(options: ReplayOptions = {}) {
  const {
    dryRun = false,
    fromDate,
    toDate,
    flowTypes: filterFlowTypes,
    eventTypes: filterEventTypes,
    maxEvents,
  } = options;

  // Safety check: ensure we're not replaying to production
  if (DEV_DATA_CORE_NAME === PROD_DATA_CORE_NAME) {
    throw new Error(
      `❌ Safety check failed: Cannot replay to production datacore "${DEV_DATA_CORE_NAME}". ` +
        `The dev datacore name is "${DEV_DATA_CORE_NAME}" (from FLOWCORE_DATA_CORE).`
    );
  }

  console.log("🚀 Starting event replay...");
  console.log(`   Source: ${PROD_DATA_CORE_NAME} (production)`);
  console.log(`   Target: ${DEV_DATA_CORE_NAME} (dev)`);
  console.log(`   Mode: ${dryRun ? "DRY RUN (no events will be ingested)" : "LIVE"}`);
  console.log("");

  // Resolve datacore IDs
  console.log("🔍 Resolving datacore IDs...");
  const prodFetchCommand = new DataCoreFetchCommand({
    tenant: TENANT,
    dataCore: PROD_DATA_CORE_NAME,
  });
  const prodDataCore = await client.execute(prodFetchCommand);
  console.log(`   Production: ${prodDataCore.id}`);

  const devFetchCommand = new DataCoreFetchCommand({
    tenant: TENANT,
    dataCore: DEV_DATA_CORE_NAME,
  });
  const devDataCore = await client.execute(devFetchCommand);
  console.log(`   Dev: ${devDataCore.id}`);
  console.log("");

  if (!dryRun) {
    // Require confirmation
    console.log("⚠️  WARNING: This will ingest events into the dev datacore.");
    console.log("   Press Ctrl+C to cancel, or wait 5 seconds to continue...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  let totalEventsReplayed = 0;
  const stats: Record<string, number> = {};

  // Determine date range
  const from = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
  const to = toDate || new Date();

  console.log(`📅 Date range: ${from.toISOString()} to ${to.toISOString()}`);
  console.log("");

  // Process each flow type
  for (const flowTypeConfig of FLOW_TYPES) {
    // Skip if filtered
    if (filterFlowTypes && !filterFlowTypes.includes(flowTypeConfig.name)) {
      continue;
    }

    console.log(`📦 Processing flow type: ${flowTypeConfig.name}`);

    for (const eventTypeName of flowTypeConfig.eventTypes) {
      // Skip if filtered
      if (filterEventTypes && !filterEventTypes.includes(eventTypeName)) {
        continue;
      }

      try {
        console.log(`  📥 Fetching events: ${eventTypeName}...`);

        // Get time buckets for this event type in the date range
        const fromTimeBucket = formatTimeBucket(from);
        const toTimeBucket = formatTimeBucket(to);

        const timeBucketsCommand = new EventsFetchTimeBucketsByNamesCommand({
          tenant: TENANT,
          dataCoreId: prodDataCore.id,
          flowType: flowTypeConfig.name,
          eventTypes: [eventTypeName],
          fromTimeBucket,
          toTimeBucket,
          pageSize: 1000,
        });

        const timeBucketsResult = await client.execute(timeBucketsCommand);
        const timeBuckets = timeBucketsResult.timeBuckets || [];

        console.log(`    Found ${timeBuckets.length} time buckets`);

        // Fetch events from each time bucket
        for (const timeBucket of timeBuckets) {
          if (maxEvents && totalEventsReplayed >= maxEvents) {
            console.log(`    ⚠️  Reached max events limit (${maxEvents}), stopping...`);
            break;
          }

          let cursor: string | undefined;
          let pageCount = 0;

          do {
            const fetchCommand = new EventsFetchCommand({
              tenant: TENANT,
              dataCoreId: prodDataCore.id,
              flowType: flowTypeConfig.name,
              eventTypes: [eventTypeName],
              timeBucket,
              cursor,
              pageSize: 100,
            });

            const result = await client.execute(fetchCommand);
            const events = result.events || [];

            if (events.length === 0) {
              break;
            }

            pageCount++;
            console.log(
              `    Processing time bucket ${timeBucket}, page ${pageCount}: ${events.length} events`
            );

            // Replay each event
            for (const event of events) {
              if (maxEvents && totalEventsReplayed >= maxEvents) {
                break;
              }

              if (!dryRun) {
                try {
                  await ingestEventToDev(
                    devDataCore.id,
                    flowTypeConfig.name,
                    eventTypeName,
                    event.payload
                  );
                  totalEventsReplayed++;
                  stats[eventTypeName] = (stats[eventTypeName] || 0) + 1;
                } catch (error) {
                  console.error(
                    `    ❌ Failed to replay event ${event.id}:`,
                    error instanceof Error ? error.message : error
                  );
                  // Continue with next event
                }
              } else {
                totalEventsReplayed++;
                stats[eventTypeName] = (stats[eventTypeName] || 0) + 1;
              }
            }

            cursor = result.nextCursor;
          } while (cursor && (!maxEvents || totalEventsReplayed < maxEvents));

          if (maxEvents && totalEventsReplayed >= maxEvents) {
            break;
          }
        }

        console.log(`  ✅ Completed ${eventTypeName}: ${stats[eventTypeName] || 0} events`);
      } catch (error) {
        console.error(`  ❌ Failed to process ${eventTypeName}:`, error);
        // Continue with next event type
      }
    }
  }

  console.log("");
  console.log("📊 Replay Summary:");
  console.log(`   Total events: ${totalEventsReplayed}`);
  console.log("   By event type:");
  for (const [eventType, count] of Object.entries(stats)) {
    console.log(`     ${eventType}: ${count}`);
  }
  console.log("");

  if (dryRun) {
    console.log("💡 This was a dry run. Run without --dry-run to actually replay events.");
  } else {
    console.log("✅ Event replay complete!");
    console.log("   Note: Backend will need to process these events to update the database.");
  }
}

/**
 * Main function
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: ReplayOptions = {
    dryRun: args.includes("--dry-run"),
  };

  // Parse date range
  const fromDateIndex = args.indexOf("--from-date");
  if (fromDateIndex !== -1 && args[fromDateIndex + 1]) {
    options.fromDate = new Date(args[fromDateIndex + 1]);
  }

  const toDateIndex = args.indexOf("--to-date");
  if (toDateIndex !== -1 && args[toDateIndex + 1]) {
    options.toDate = new Date(args[toDateIndex + 1]);
  }

  // Parse flow types filter
  const flowTypesIndex = args.indexOf("--flow-types");
  if (flowTypesIndex !== -1 && args[flowTypesIndex + 1]) {
    options.flowTypes = args[flowTypesIndex + 1].split(",");
  }

  // Parse event types filter
  const eventTypesIndex = args.indexOf("--event-types");
  if (eventTypesIndex !== -1 && args[eventTypesIndex + 1]) {
    options.eventTypes = args[eventTypesIndex + 1].split(",");
  }

  // Parse max events
  const maxEventsIndex = args.indexOf("--max-events");
  if (maxEventsIndex !== -1 && args[maxEventsIndex + 1]) {
    options.maxEvents = Number.parseInt(args[maxEventsIndex + 1], 10);
  }

  try {
    await replayEvents(options);
  } catch (error) {
    console.error("❌ Replay failed:", error);
    process.exit(1);
  }
}

main();
