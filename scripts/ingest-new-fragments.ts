#!/usr/bin/env bun
/**
 * Ingest New Fragments Script
 *
 * Fetches recently created fragments from Usable and ingests them into Flowcore.
 * Useful for ingesting only new events that were added after the initial migration.
 *
 * Usage:
 *   bun run scripts/ingest-new-fragments.ts [--since YYYY-MM-DD] [--limit N] [--type fragmentTypeId]
 *
 * Examples:
 *   bun run scripts/ingest-new-fragments.ts --since 2026-01-01
 *   bun run scripts/ingest-new-fragments.ts --limit 4
 *   bun run scripts/ingest-new-fragments.ts --type 0151d333-4dc7-4ceb-aeef-2c7e783a8f5b --limit 4
 *
 * Environment variables required:
 *   - CALENDRUN_USABLE_API_TOKEN
 *   - CALENDRUN_USABLE_WORKSPACE_ID
 *   - FLOWCORE_TENANT
 *   - FLOWCORE_DATA_CORE_ID (or will be resolved from FLOWCORE_DATA_CORE)
 *   - FLOWCORE_API_KEY
 *   - FLOWCORE_INGESTION_BASE_URL (optional, defaults to https://webhook.api.flowcore.io)
 */

import { env } from "../src/env";
import { getDataCoreId } from "../src/services/flowcore-client";

// Fragment Type IDs from Usable
const RUN_PERFORMANCE_FRAGMENT_TYPE_ID = "0151d333-4dc7-4ceb-aeef-2c7e783a8f5b";

const USABLE_API_BASE_URL = "https://usable.dev/api";
const USABLE_API_TOKEN = process.env.CALENDRUN_USABLE_API_TOKEN;
const USABLE_WORKSPACE_ID = process.env.CALENDRUN_USABLE_WORKSPACE_ID;

if (!USABLE_API_TOKEN || !USABLE_WORKSPACE_ID) {
  console.error("❌ Missing required environment variables:");
  console.error("   CALENDRUN_USABLE_API_TOKEN");
  console.error("   CALENDRUN_USABLE_WORKSPACE_ID");
  process.exit(1);
}

interface UsableFragment {
  id: string;
  fragment_type_id: string;
  title: string;
  summary?: string;
  frontmatter?: Record<string, unknown>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface UsableListResponse {
  fragments: UsableFragment[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Fetch fragments from Usable API
 */
async function fetchUsableFragments(
  fragmentTypeId: string,
  sinceDate?: string,
  limit = 100,
  offset = 0
): Promise<UsableFragment[]> {
  let query = `fragment_type_id = '${fragmentTypeId}' AND status IN ('active', 'stale')`;

  if (sinceDate) {
    query += ` AND created_at >= '${sinceDate}'`;
  }

  const response = await fetch(`${USABLE_API_BASE_URL}/fragments/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${USABLE_API_TOKEN}`,
    },
    body: JSON.stringify({
      workspaceId: USABLE_WORKSPACE_ID,
      query,
      orderBy: "created_at DESC", // Newest first
      limit,
      offset,
      select: [
        "id",
        "fragment_type_id",
        "title",
        "summary",
        "status",
        "created_at",
        "updated_at",
        "tags",
        "frontmatter",
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Usable API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as UsableListResponse;
  return data.fragments;
}

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
 * Helper to get frontmatter value (supports both lowercase and PascalCase)
 */
function getFrontmatterValue(frontmatter: Record<string, unknown>, key: string): unknown {
  const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
  return frontmatter[key] ?? frontmatter[pascalKey];
}

/**
 * Migrate run performances
 */
async function migrateRunPerformances(
  dataCoreId: string,
  sinceDate?: string,
  limit?: number
): Promise<void> {
  console.log("\n🏃 Fetching run performances...");

  const fragments = await fetchUsableFragments(
    RUN_PERFORMANCE_FRAGMENT_TYPE_ID,
    sinceDate,
    limit ?? 100,
    0
  );

  // If limit is specified, only take that many
  const fragmentsToProcess = limit ? fragments.slice(0, limit) : fragments;

  console.log(`   Found ${fragments.length} total fragments`);
  console.log(`   Processing ${fragmentsToProcess.length} fragments...`);

  let successCount = 0;
  let errorCount = 0;

  for (const fragment of fragmentsToProcess) {
    try {
      const frontmatter = fragment.frontmatter ?? {};
      const instanceId = getFrontmatterValue(frontmatter, "instanceId") as string;
      const userId = getFrontmatterValue(frontmatter, "userId") as string;
      const runnerName = getFrontmatterValue(frontmatter, "runnerName") as string | undefined;
      const runDate = getFrontmatterValue(frontmatter, "runDate") as string;
      const distanceKm = getFrontmatterValue(frontmatter, "distanceKm") as number;
      const timeMinutes = getFrontmatterValue(frontmatter, "timeMinutes") as number | undefined;
      const notes = getFrontmatterValue(frontmatter, "notes") as string | undefined;
      const status = (getFrontmatterValue(frontmatter, "status") as string) ?? "completed";
      const recordedAt = getFrontmatterValue(frontmatter, "recordedAt") as string | undefined;
      const changeLog = getFrontmatterValue(frontmatter, "changeLog") as
        | Record<string, unknown>
        | undefined;

      // Normalize runDate to date-only format
      const normalizedRunDate = runDate.includes("T")
        ? (runDate.split("T")[0] ?? runDate)
        : runDate;

      console.log(`   📤 Ingesting: ${fragment.title} (${fragment.id})`);

      await emitFlowcoreEvent(
        "run.0",
        "run.logged.0",
        {
          id: fragment.id,
          instanceId,
          userId,
          runnerName,
          runDate: normalizedRunDate,
          distanceKm,
          timeMinutes,
          notes,
          status,
          recordedAt,
          changeLog,
        },
        dataCoreId
      );

      successCount++;
    } catch (error) {
      errorCount++;
      console.error(
        `   ❌ Error ingesting ${fragment.id}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(
    `\n   ✅ Successfully ingested ${successCount} run performances${errorCount > 0 ? `, ${errorCount} errors` : ""}`
  );
}

/**
 * Main function
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let sinceDate: string | undefined;
  let limit: number | undefined;
  let fragmentTypeId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--since" && args[i + 1]) {
      sinceDate = args[i + 1];
      i++;
    } else if (args[i] === "--limit" && args[i + 1]) {
      limit = Number.parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--type" && args[i + 1]) {
      fragmentTypeId = args[i + 1];
      i++;
    }
  }

  console.log("🚀 Starting ingestion of new fragments...");
  console.log(`   Tenant: ${env.FLOWCORE_TENANT}`);
  console.log(`   Data Core: ${env.FLOWCORE_DATA_CORE}`);
  if (sinceDate) {
    console.log(`   Since: ${sinceDate}`);
  }
  if (limit) {
    console.log(`   Limit: ${limit}`);
  }

  try {
    // Resolve datacore ID
    const dataCoreId = await getDataCoreId();
    console.log(`   Data Core ID: ${dataCoreId}\n`);

    // For now, only support run performances
    // Can be extended to support other types via --type flag
    const typeToMigrate = fragmentTypeId ?? RUN_PERFORMANCE_FRAGMENT_TYPE_ID;

    if (typeToMigrate === RUN_PERFORMANCE_FRAGMENT_TYPE_ID) {
      await migrateRunPerformances(dataCoreId, sinceDate, limit);
    } else {
      console.error(`❌ Unsupported fragment type: ${typeToMigrate}`);
      console.error(`   Supported types: ${RUN_PERFORMANCE_FRAGMENT_TYPE_ID} (run performances)`);
      process.exit(1);
    }

    console.log("\n✅ Ingestion completed successfully!");
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
