#!/usr/bin/env bun
/**
 * Ingest Specific Fragments Script
 *
 * Ingests specific fragments by their IDs into Flowcore datacore.
 *
 * Usage:
 *   bun run scripts/ingest-specific-fragments.ts
 *
 * Environment variables required:
 *   - FLOWCORE_TENANT
 *   - FLOWCORE_DATA_CORE_ID (or will be resolved from FLOWCORE_DATA_CORE)
 *   - FLOWCORE_API_KEY
 *   - FLOWCORE_INGESTION_BASE_URL (optional, defaults to https://webhook.api.flowcore.io)
 */

import { env } from "../src/env";
import { getDataCoreId } from "../src/services/flowcore-client";

// Fragment IDs to ingest
const FRAGMENT_IDS = [
  "22449d51-a792-42b9-9ff6-de10c07d0674",
  "682a45a0-a8f7-4a52-bd45-19cf11852fdd",
  "2fd7e67d-59c3-495d-afb1-4873e9c13bab",
  "08eded92-2ca8-44e5-bfa3-ed2fd519a93d",
  "e579e37c-27c2-4f99-a393-2fa82892388b",
  "d4549777-49c2-4a3f-b347-7faef8285a5f",
  "72364e99-e8e7-409c-af8c-47448030e64b",
];

// Fragment data (extracted from Usable fragments)
const FRAGMENT_DATA = [
  {
    id: "22449d51-a792-42b9-9ff6-de10c07d0674",
    instanceId: "7813b88c-ef58-4f54-b4a4-343ad5b643ab",
    userId: "9ef6bd94-009e-4779-93e8-fa8a3165898d",
    runnerName: "Maria Nielsdóttir",
    runDate: "2026-01-08",
    distanceKm: 4,
    status: "completed",
    notes: "Upphiting 3.jan",
    recordedAt: "2026-01-03T14:32:45.415Z",
    changeLog: [
      {
        timestamp: "2026-01-03T14:32:45.415Z",
        action: "created",
        details: "Created run with distance 4km",
      },
    ],
  },
  {
    id: "682a45a0-a8f7-4a52-bd45-19cf11852fdd",
    instanceId: "7813b88c-ef58-4f54-b4a4-343ad5b643ab",
    userId: "9ef6bd94-009e-4779-93e8-fa8a3165898d",
    runnerName: "Maria Nielsdóttir",
    runDate: "2026-01-17",
    distanceKm: 8.5,
    status: "completed",
    notes: "Interval 6x800m plus avrenning",
    recordedAt: "2026-01-03T14:33:15.043Z",
    changeLog: [
      {
        timestamp: "2026-01-03T14:33:15.043Z",
        action: "created",
        details: "Created run with distance 8.5km",
      },
    ],
  },
  {
    id: "2fd7e67d-59c3-495d-afb1-4873e9c13bab",
    instanceId: "ee1beb9a-691a-4c60-8a26-c8387632e775",
    userId: "50ed443d-2824-4cd8-8abb-05c35e250ad5",
    runnerName: "Óluva Zachariasen",
    runDate: "2026-01-08",
    distanceKm: 6,
    status: "completed",
    recordedAt: "2026-01-03T14:37:38.576Z",
    changeLog: [
      {
        timestamp: "2026-01-03T14:37:38.576Z",
        action: "created",
        details: "Created run with distance 6km",
      },
    ],
  },
  {
    id: "08eded92-2ca8-44e5-bfa3-ed2fd519a93d",
    instanceId: "e94951be-e994-42b5-9f19-8d659b9af5dc",
    userId: "1b1733f4-b61b-4b17-a894-d2a2a1619cbf",
    runnerName: "Elisabeth Larsen",
    runDate: "2026-01-28",
    distanceKm: 14,
    status: "completed",
    recordedAt: "2026-01-03T16:30:26.461Z",
    changeLog: [
      {
        timestamp: "2026-01-03T16:30:26.461Z",
        action: "created",
        details: "Created run with distance 14km",
      },
    ],
  },
  {
    id: "e579e37c-27c2-4f99-a393-2fa82892388b",
    instanceId: "42456182-9fb4-4cc6-b4f4-ee9cb9e87cff",
    userId: "d3211c2a-1646-4dc9-a0fd-22d39be60d73",
    runnerName: "Hallur Holm",
    runDate: "2026-01-21",
    distanceKm: 18.375,
    status: "completed",
    recordedAt: "2026-01-03T17:02:00.667Z",
    changeLog: [
      {
        timestamp: "2026-01-03T17:02:00.667Z",
        action: "created",
        details: "Created run with distance 18.375km",
      },
    ],
  },
  {
    id: "d4549777-49c2-4a3f-b347-7faef8285a5f",
    instanceId: "6367bf3e-029b-41ee-a82d-838cd0804d31",
    userId: "6be88b4d-4e12-48e6-9e98-2faed962a65c",
    runnerName: "Elin Jakobsen",
    runDate: "2026-01-27",
    distanceKm: 10.125,
    timeMinutes: 58,
    status: "completed",
    recordedAt: "2026-01-03T18:28:01.277Z",
    changeLog: [
      {
        timestamp: "2026-01-03T18:28:01.277Z",
        action: "created",
        details: "Created run with distance 10.125km in 58m",
      },
    ],
  },
  {
    id: "72364e99-e8e7-409c-af8c-47448030e64b",
    instanceId: "74b0a9da-c56c-4d65-8ffd-ff8633bdefee",
    userId: "4bdf34a3-cead-48c0-9966-877af0a4cbfc",
    runnerName: "Krista Nielsen",
    runDate: "2026-01-08",
    distanceKm: 8,
    timeMinutes: 50,
    status: "completed",
    recordedAt: "2026-01-03T18:44:01.603Z",
    changeLog: [
      {
        timestamp: "2026-01-03T18:44:01.603Z",
        action: "created",
        details: "Created run with distance 8km in 50m",
      },
    ],
  },
];

/**
 * Build Flowcore ingestion URL
 */
function buildIngestionUrl(
  flowTypeName: string,
  eventTypeName: string,
  dataCoreId: string
): string {
  const baseUrl =
    (env.FLOWCORE_INGESTION_BASE_URL as string | undefined) ??
    (process.env.FLOWCORE_INGESTION_BASE_URL as string | undefined) ??
    "https://webhook.api.flowcore.io";
  const tenant = env.FLOWCORE_TENANT;
  const apiKey = env.FLOWCORE_API_KEY;

  if (!baseUrl || typeof baseUrl !== "string") {
    throw new Error(`FLOWCORE_INGESTION_BASE_URL is not set or invalid: ${baseUrl}`);
  }

  const url = new URL(`/event/${tenant}/${dataCoreId}/${flowTypeName}/${eventTypeName}`, baseUrl);
  url.searchParams.set("key", apiKey);
  return url.toString();
}

/**
 * Emit event to Flowcore
 */
async function emitFlowcoreEvent(
  flowTypeName: string,
  eventTypeName: string,
  payload: unknown,
  dataCoreId: string
): Promise<void> {
  const url = buildIngestionUrl(flowTypeName, eventTypeName, dataCoreId);

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
 * Main function
 */
async function main() {
  console.log("🚀 Starting ingestion of specific fragments...");
  console.log(`   Tenant: ${env.FLOWCORE_TENANT}`);
  console.log(`   Data Core: ${env.FLOWCORE_DATA_CORE}`);
  console.log(`   Fragments to ingest: ${FRAGMENT_DATA.length}\n`);

  try {
    // Resolve datacore ID
    const dataCoreId = await getDataCoreId();
    console.log(`   Data Core ID: ${dataCoreId}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const fragment of FRAGMENT_DATA) {
      try {
        console.log(
          `   📤 Ingesting: ${fragment.id} - ${fragment.runnerName} - ${fragment.distanceKm}km on ${fragment.runDate}`
        );

        await emitFlowcoreEvent(
          "run.0",
          "run.logged.0",
          {
            id: fragment.id,
            instanceId: fragment.instanceId,
            userId: fragment.userId,
            runnerName: fragment.runnerName,
            runDate: fragment.runDate,
            distanceKm: fragment.distanceKm,
            timeMinutes: fragment.timeMinutes,
            notes: fragment.notes,
            status: fragment.status,
            recordedAt: fragment.recordedAt,
            changeLog: fragment.changeLog,
          },
          dataCoreId
        );

        successCount++;
        console.log(`   ✅ Successfully ingested fragment ${fragment.id}\n`);
      } catch (error) {
        errorCount++;
        console.error(
          `   ❌ Error ingesting ${fragment.id}:`,
          error instanceof Error ? error.message : error
        );
        console.log();
      }
    }

    console.log("\n✅ Ingestion completed!");
    console.log(`   Successfully ingested: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount}`);
    }
    console.log("\n💡 Next steps:");
    console.log("   1. The backend event streamer will automatically process these events");
    console.log("   2. Check PostgreSQL to verify the data was processed");
  } catch (error) {
    console.error("\n❌ Ingestion failed:", error);
    process.exit(1);
  }
}

// Run ingestion
main();
