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
 * Resolve data core name to ID (cached)
 */
export async function getDataCoreId(): Promise<string> {
  if (dataCoreId) {
    return dataCoreId;
  }

  try {
    const command = new DataCoreFetchCommand({
      tenant: env.FLOWCORE_TENANT,
      dataCore: env.FLOWCORE_DATA_CORE,
    });
    const dataCore = await client.execute(command);

    dataCoreId = dataCore.id;
    console.log(`✅ Resolved data core "${env.FLOWCORE_DATA_CORE}" to ID: ${dataCoreId}`);
    return dataCoreId;
  } catch (error) {
    console.error(`❌ Failed to resolve data core "${env.FLOWCORE_DATA_CORE}":`, error);
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
    console.error(
      `❌ Failed to fetch events for ${flowTypeName}/${eventTypeName} at ${timeBucket}:`,
      error
    );
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
