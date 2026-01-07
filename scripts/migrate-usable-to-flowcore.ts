#!/usr/bin/env bun
/**
 * Migration Script: Usable → Flowcore
 *
 * Reads data from CalendRun Usable workspace and ingests it as events into Flowcore.
 * This creates seed data that can then be processed by the backend event streamer
 * to populate the PostgreSQL database.
 *
 * Usage:
 *   bun run scripts/migrate-usable-to-flowcore.ts
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
const CHALLENGE_TEMPLATE_FRAGMENT_TYPE_ID = "097fa58f-d055-4d82-b65c-dbc52364070f";
const CHALLENGE_INSTANCE_FRAGMENT_TYPE_ID = "8d8ce12b-c12e-4426-a20f-21b88fb5c6cc";
const RUN_PERFORMANCE_FRAGMENT_TYPE_ID = "0151d333-4dc7-4ceb-aeef-2c7e783a8f5b";
const CLUB_FRAGMENT_TYPE_ID = "1bbc56b0-1a82-414c-a1a8-b2aa330ad4a2";
const CLUB_MEMBERSHIP_FRAGMENT_TYPE_ID = "68b5196d-2ec6-48d2-801d-70fd6ed9534c";

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
  limit = 100,
  offset = 0
): Promise<UsableFragment[]> {
  const response = await fetch(`${USABLE_API_BASE_URL}/fragments/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${USABLE_API_TOKEN}`,
    },
    body: JSON.stringify({
      workspaceId: USABLE_WORKSPACE_ID,
      query: `fragment_type_id = '${fragmentTypeId}' AND status IN ('active', 'stale')`,
      orderBy: "created_at ASC",
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
 * Fetch all fragments of a type (handles pagination)
 */
async function fetchAllUsableFragments(fragmentTypeId: string): Promise<UsableFragment[]> {
  const allFragments: UsableFragment[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const fragments = await fetchUsableFragments(fragmentTypeId, limit, offset);
    if (fragments.length === 0) {
      break;
    }
    allFragments.push(...fragments);
    if (fragments.length < limit) {
      break;
    }
    offset += limit;
  }

  return allFragments;
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
 * Migrate challenge instances
 */
async function migrateChallengeInstances(dataCoreId: string): Promise<void> {
  console.log("\n📦 Migrating challenge instances...");
  const fragments = await fetchAllUsableFragments(CHALLENGE_INSTANCE_FRAGMENT_TYPE_ID);
  console.log(`   Found ${fragments.length} challenge instances`);

  let successCount = 0;
  let errorCount = 0;

  for (const fragment of fragments) {
    try {
      const frontmatter = fragment.frontmatter ?? {};
      const templateId = getFrontmatterValue(frontmatter, "templateId") as string;
      const userId = getFrontmatterValue(frontmatter, "userId") as string;
      const variant = (getFrontmatterValue(frontmatter, "variant") as string) ?? "full";
      const themeKey =
        (getFrontmatterValue(frontmatter, "themeKey") as string) ?? "december_christmas";
      const status = (getFrontmatterValue(frontmatter, "status") as string) ?? "active";
      const joinedAt =
        (getFrontmatterValue(frontmatter, "joinedAt") as string) ?? fragment.created_at;

      // Emit challenge.started.0 event
      await emitFlowcoreEvent(
        "challenge.0",
        "challenge.started.0",
        {
          id: fragment.id,
          templateId,
          userId,
          variant,
          themeKey,
          status,
          joinedAt,
        },
        dataCoreId
      );

      // If completed, emit challenge.completed.0
      if (status === "completed") {
        const totalCompletedKm = getFrontmatterValue(frontmatter, "totalCompletedKm") as
          | number
          | undefined;
        const succeeded = getFrontmatterValue(frontmatter, "succeeded") as boolean | undefined;
        const completedAt = getFrontmatterValue(frontmatter, "completedAt") as string | undefined;

        if (totalCompletedKm !== undefined && succeeded !== undefined && completedAt) {
          await emitFlowcoreEvent(
            "challenge.0",
            "challenge.completed.0",
            {
              id: fragment.id,
              userId,
              totalCompletedKm,
              succeeded,
              completedAt,
            },
            dataCoreId
          );
        }
      }

      successCount++;
      if (successCount % 10 === 0) {
        process.stdout.write(".");
      }
    } catch (error) {
      errorCount++;
      console.error(`\n   ❌ Error migrating challenge instance ${fragment.id}:`, error);
    }
  }

  console.log(
    `\n   ✅ Migrated ${successCount} challenge instances${errorCount > 0 ? `, ${errorCount} errors` : ""}`
  );
}

/**
 * Migrate challenge templates
 */
async function migrateChallengeTemplates(dataCoreId: string): Promise<void> {
  console.log("\n📋 Migrating challenge templates...");
  const fragments = await fetchAllUsableFragments(CHALLENGE_TEMPLATE_FRAGMENT_TYPE_ID);
  console.log(`   Found ${fragments.length} challenge templates`);

  let successCount = 0;
  let errorCount = 0;

  for (const fragment of fragments) {
    try {
      const frontmatter = fragment.frontmatter ?? {};
      const name = fragment.title;
      const description = fragment.summary ?? "";
      const startDateRaw = getFrontmatterValue(frontmatter, "startDate") as string;
      const endDateRaw = getFrontmatterValue(frontmatter, "endDate") as string;
      const days = getFrontmatterValue(frontmatter, "days") as number;
      const requiredDistancesKm = getFrontmatterValue(frontmatter, "requiredDistancesKm") as
        | number[]
        | undefined;
      const fullDistanceTotalKm = getFrontmatterValue(frontmatter, "fullDistanceTotalKm") as number;
      const halfDistanceTotalKm = getFrontmatterValue(frontmatter, "halfDistanceTotalKm") as number;
      const themeKey =
        (getFrontmatterValue(frontmatter, "themeKey") as string) ?? "december_christmas";

      if (
        !startDateRaw ||
        !endDateRaw ||
        !days ||
        fullDistanceTotalKm === undefined ||
        halfDistanceTotalKm === undefined
      ) {
        console.warn(`   ⚠️  Skipping template ${fragment.id}: missing required fields`);
        errorCount++;
        continue;
      }

      // Convert dates to ISO 8601 datetime format if needed
      // If it's just a date (YYYY-MM-DD), add time component
      let startDate = startDateRaw;
      let endDate = endDateRaw;

      if (startDateRaw.match(/^\d{4}-\d{2}-\d{2}$/)) {
        startDate = `${startDateRaw}T00:00:00.000Z`;
      } else if (!startDateRaw.includes("T")) {
        // Try to parse and convert
        const parsed = new Date(startDateRaw);
        if (!Number.isNaN(parsed.getTime())) {
          startDate = parsed.toISOString();
        }
      }

      if (endDateRaw.match(/^\d{4}-\d{2}-\d{2}$/)) {
        endDate = `${endDateRaw}T23:59:59.999Z`;
      } else if (!endDateRaw.includes("T")) {
        // Try to parse and convert
        const parsed = new Date(endDateRaw);
        if (!Number.isNaN(parsed.getTime())) {
          endDate = parsed.toISOString();
        }
      }

      // Emit challenge.template.created.0 event
      await emitFlowcoreEvent(
        "challenge.template.0",
        "challenge.template.created.0",
        {
          id: fragment.id,
          name,
          description,
          startDate,
          endDate,
          days,
          requiredDistancesKm: requiredDistancesKm ?? [],
          fullDistanceTotalKm,
          halfDistanceTotalKm,
          themeKey,
        },
        dataCoreId
      );

      successCount++;
      if (successCount % 10 === 0) {
        process.stdout.write(".");
      }
    } catch (error) {
      errorCount++;
      console.error(`\n   ❌ Error migrating challenge template ${fragment.id}:`, error);
    }
  }

  console.log(
    `\n   ✅ Migrated ${successCount} challenge templates${errorCount > 0 ? `, ${errorCount} errors` : ""}`
  );
}

/**
 * Migrate run performances
 */
async function migrateRunPerformances(dataCoreId: string): Promise<void> {
  console.log("\n🏃 Migrating run performances...");
  const fragments = await fetchAllUsableFragments(RUN_PERFORMANCE_FRAGMENT_TYPE_ID);
  console.log(`   Found ${fragments.length} run performances`);

  let successCount = 0;
  let errorCount = 0;

  for (const fragment of fragments) {
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
      if (successCount % 10 === 0) {
        process.stdout.write(".");
      }
    } catch (error) {
      errorCount++;
      console.error(`\n   ❌ Error migrating run performance ${fragment.id}:`, error);
    }
  }

  console.log(
    `\n   ✅ Migrated ${successCount} run performances${errorCount > 0 ? `, ${errorCount} errors` : ""}`
  );
}

/**
 * Migrate clubs
 */
async function migrateClubs(dataCoreId: string): Promise<void> {
  console.log("\n👥 Migrating clubs...");
  const fragments = await fetchAllUsableFragments(CLUB_FRAGMENT_TYPE_ID);
  console.log(`   Found ${fragments.length} clubs`);

  let successCount = 0;
  let errorCount = 0;

  for (const fragment of fragments) {
    try {
      const frontmatter = fragment.frontmatter ?? {};
      const name = (getFrontmatterValue(frontmatter, "name") as string) ?? fragment.title;
      const description = getFrontmatterValue(frontmatter, "description") as string | undefined;
      const inviteToken = getFrontmatterValue(frontmatter, "inviteToken") as string;
      const logoUrl = getFrontmatterValue(frontmatter, "logoUrl") as string | undefined;
      const welcomeText = getFrontmatterValue(frontmatter, "welcomeText") as
        | Record<string, unknown>
        | undefined;
      const shortDescription = getFrontmatterValue(frontmatter, "shortDescription") as
        | Record<string, unknown>
        | undefined;

      await emitFlowcoreEvent(
        "club.0",
        "club.created.0",
        {
          id: fragment.id,
          name,
          description,
          inviteToken,
          logoUrl,
          welcomeText,
          shortDescription,
        },
        dataCoreId
      );

      successCount++;
      if (successCount % 10 === 0) {
        process.stdout.write(".");
      }
    } catch (error) {
      errorCount++;
      console.error(`\n   ❌ Error migrating club ${fragment.id}:`, error);
    }
  }

  console.log(
    `\n   ✅ Migrated ${successCount} clubs${errorCount > 0 ? `, ${errorCount} errors` : ""}`
  );
}

/**
 * Migrate club memberships
 */
async function migrateClubMemberships(dataCoreId: string): Promise<void> {
  console.log("\n👤 Migrating club memberships...");
  const fragments = await fetchAllUsableFragments(CLUB_MEMBERSHIP_FRAGMENT_TYPE_ID);
  console.log(`   Found ${fragments.length} club memberships`);

  let successCount = 0;
  let errorCount = 0;

  for (const fragment of fragments) {
    try {
      const frontmatter = fragment.frontmatter ?? {};

      // Try frontmatter first, then tags as fallback
      let clubId = getFrontmatterValue(frontmatter, "clubId") as string | undefined;
      let userId = getFrontmatterValue(frontmatter, "userId") as string | undefined;

      if (!clubId || !userId) {
        const clubTag = fragment.tags?.find((t) => t.startsWith("club:"))?.replace("club:", "");
        const userTag = fragment.tags?.find((t) => t.startsWith("user:"))?.replace("user:", "");
        clubId = clubId ?? clubTag;
        userId = userId ?? userTag;
      }

      if (!clubId || !userId) {
        console.warn(`   ⚠️  Skipping membership ${fragment.id}: missing clubId or userId`);
        continue;
      }

      const userName = getFrontmatterValue(frontmatter, "userName") as string | undefined;
      const role = (getFrontmatterValue(frontmatter, "role") as "admin" | "member") ?? "member";
      const joinedAt =
        (getFrontmatterValue(frontmatter, "joinedAt") as string) ?? fragment.created_at;

      await emitFlowcoreEvent(
        "club.0",
        "club.member.joined.0",
        {
          id: fragment.id,
          clubId,
          userId,
          userName,
          role,
          joinedAt,
        },
        dataCoreId
      );

      successCount++;
      if (successCount % 10 === 0) {
        process.stdout.write(".");
      }
    } catch (error) {
      errorCount++;
      console.error(`\n   ❌ Error migrating club membership ${fragment.id}:`, error);
    }
  }

  console.log(
    `\n   ✅ Migrated ${successCount} club memberships${errorCount > 0 ? `, ${errorCount} errors` : ""}`
  );
}


/**
 * Main migration function
 */
async function main() {
  console.log("🚀 Starting migration from Usable to Flowcore...");
  console.log(`   Tenant: ${env.FLOWCORE_TENANT}`);
  console.log(`   Data Core: ${env.FLOWCORE_DATA_CORE}`);

  try {
    // Resolve datacore ID
    const dataCoreId = await getDataCoreId();
    console.log(`   Data Core ID: ${dataCoreId}\n`);

    // Migrate in order (respecting dependencies)
    // 1. Challenge templates first (instances reference templates)
    await migrateChallengeTemplates(dataCoreId);

    // 2. Clubs (memberships reference clubs)
    await migrateClubs(dataCoreId);

    // 3. Club memberships
    await migrateClubMemberships(dataCoreId);

    // 4. Challenge instances (runs reference instances)
    await migrateChallengeInstances(dataCoreId);

    // 5. Run performances
    await migrateRunPerformances(dataCoreId);

    console.log("\n✅ Migration completed successfully!");
    console.log("\n💡 Next steps:");
    console.log("   1. Start the backend server to process the ingested events");
    console.log("   2. The event streamer will poll and populate PostgreSQL");
    console.log("   3. Verify data in PostgreSQL matches the ingested events");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
main();
