import {
    DataCoreFetchCommand,
    EventsFetchCommand,
    EventsFetchTimeBucketsByNamesCommand,
    FlowcoreClient,
} from "@flowcore/sdk";
import { env } from "../env";

let dataCoreId: string | null = null;

const client = new FlowcoreClient({
  apiKey: env.FLOWCORE_API_KEY,
  retry: {
    delay: 250,
    maxRetries: 3,
  },
});

/**
 * Get the data core name to use
 * In DEV_MODE, FLOWCORE_DATA_CORE should be set to the dev datacore name (e.g., "calendrun-dev")
 */
function getDataCoreName(): string {
  if (env.DEV_MODE) {
    // Safety check: ensure we're not accidentally using production datacore
    if (env.FLOWCORE_DATA_CORE === "calendrun") {
      throw new Error(
        "❌ Safety check failed: DEV_MODE is enabled but FLOWCORE_DATA_CORE is set to production datacore 'calendrun'. " +
          "Set FLOWCORE_DATA_CORE=calendrun-dev in your .env.development file."
      );
    }
  }
  return env.FLOWCORE_DATA_CORE;
}

/**
 * Resolve data core name to ID (cached)
 */
export async function getDataCoreId(): Promise<string> {
  if (dataCoreId) {
    return dataCoreId;
  }

  const dataCoreName = getDataCoreName();
  const mode = env.DEV_MODE ? "DEV" : "PRODUCTION";

  try {
    const command = new DataCoreFetchCommand({
      tenant: env.FLOWCORE_TENANT,
      dataCore: dataCoreName,
    });
    const dataCore = await client.execute(command);

    dataCoreId = dataCore.id;
    console.log(`✅ [${mode}] Resolved data core "${dataCoreName}" to ID: ${dataCoreId}`);
    return dataCoreId;
  } catch (error) {
    console.error(`❌ [${mode}] Failed to resolve data core "${dataCoreName}":`, error);
    throw error;
  }
}

/**
 * Format time bucket (YYYYMMDDHH0000)
 */
export function formatTimeBucket(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  return `${year}${month}${day}${hour}0000`;
}

/**
 * Get current time bucket
 */
export function getCurrentTimeBucket(): string {
  return formatTimeBucket(new Date());
}

/**
 * Get previous time bucket
 */
export function getPreviousTimeBucket(): string {
  const date = new Date();
  date.setUTCHours(date.getUTCHours() - 1);
  return formatTimeBucket(date);
}

/**
 * Fetch events for a time bucket
 */
export async function fetchEvents(
  flowTypeName: string,
  eventTypeName: string,
  timeBucket: string,
  cursor?: string,
  pageSize = 500
) {
  const dataCoreId = await getDataCoreId();

  try {
    // API expects flowType (string) and eventTypes (array)
    // Try with expected parameter names in case SDK version mismatch
    const command = new EventsFetchCommand({
      tenant: env.FLOWCORE_TENANT,
      dataCoreId,
      flowType: flowTypeName,
      eventTypes: [eventTypeName],
      timeBucket,
      cursor,
      pageSize,
    });
    const result = await client.execute(command);

    return result;
  } catch (error) {
    // Don't log here - let the caller handle and log errors appropriately
    // This allows event-streamer to silently skip unauthorized errors
    throw error;
  }
}

/**
 * Get available time buckets for an event type
 */
export async function getTimeBuckets(
  flowTypeName: string,
  eventTypeName: string,
  fromTimeBucket?: string,
  toTimeBucket?: string,
  pageSize = 100
) {
  const dataCoreId = await getDataCoreId();

  try {
    // API expects flowType (string) and eventTypes (array)
    // Try with expected parameter names in case SDK version mismatch
    const command = new EventsFetchTimeBucketsByNamesCommand({
      tenant: env.FLOWCORE_TENANT,
      dataCoreId,
      flowType: flowTypeName,
      eventTypes: [eventTypeName],
      fromTimeBucket,
      toTimeBucket,
      pageSize,
    });
    const result = await client.execute(command);

    return result;
  } catch (error) {
    console.error(`❌ Failed to get time buckets for ${flowTypeName}/${eventTypeName}:`, error);
    throw error;
  }
}
