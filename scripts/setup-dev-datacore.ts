import {
    DataCoreCreateCommand,
    DataCoreFetchCommand,
    EventTypeCreateCommand,
    FlowTypeCreateCommand,
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

const TENANT_ID = env.FLOWCORE_TENANT;
// Use FLOWCORE_DATA_CORE directly (should be set to dev datacore name in dev mode)
const DEV_DATA_CORE_NAME = env.FLOWCORE_DATA_CORE;

// Flow types and event types to create (matching production structure)
const FLOW_TYPES = [
  {
    name: "run.0",
    description: "Run performance events",
    eventTypes: ["run.logged.0", "run.updated.0", "run.deleted.0"],
  },
  {
    name: "challenge.0",
    description: "Challenge instance events",
    eventTypes: ["challenge.started.0", "challenge.updated.0", "challenge.completed.0"],
  },
  {
    name: "challenge.template.0",
    description: "Challenge template events",
    eventTypes: [
      "challenge.template.created.0",
      "challenge.template.updated.0",
      "challenge.template.deleted.0",
    ],
  },
  {
    name: "club.0",
    description: "Club events",
    eventTypes: [
      "club.created.0",
      "club.updated.0",
      "club.member.joined.0",
      "club.member.left.0",
    ],
  },
  {
    name: "user.0",
    description: "User events",
    eventTypes: ["user.created.0", "user.updated.0"],
  },
];

/**
 * Create or verify dev datacore exists
 */
async function createOrVerifyDataCore(): Promise<string> {
  console.log(`🔍 Checking if datacore "${DEV_DATA_CORE_NAME}" exists...`);

  try {
    // Try to fetch existing datacore
    const fetchCommand = new DataCoreFetchCommand({
      tenant: TENANT_ID,
      dataCore: DEV_DATA_CORE_NAME,
    });
    const dataCore = await client.execute(fetchCommand);
    console.log(`✅ Datacore "${DEV_DATA_CORE_NAME}" already exists (ID: ${dataCore.id})`);
    return dataCore.id;
  } catch (error) {
    // Datacore doesn't exist, create it
    console.log(`📦 Datacore "${DEV_DATA_CORE_NAME}" does not exist. Creating it...`);

    try {
      // DataCoreCreateCommand requires tenantId (UUID), not tenant name
      // For flowcore-saas tenant, the ID is: 9e25f8e9-bb93-4b74-8b38-81f1f5ca6d34
      // If TENANT_ID is already a UUID, use it; otherwise use the known ID for flowcore-saas
      const tenantId = TENANT_ID === "flowcore-saas" 
        ? "9e25f8e9-bb93-4b74-8b38-81f1f5ca6d34"
        : TENANT_ID.includes("-") && TENANT_ID.length === 36
        ? TENANT_ID
        : "9e25f8e9-bb93-4b74-8b38-81f1f5ca6d34"; // Default to flowcore-saas ID

      const createCommand = new DataCoreCreateCommand({
        tenantId,
        name: DEV_DATA_CORE_NAME,
        description: "Development/test datacore for CalendRun",
        accessControl: "private",
        deleteProtection: false,
      });
      const newDataCore = await client.execute(createCommand);
      console.log(`✅ Created datacore "${DEV_DATA_CORE_NAME}" (ID: ${newDataCore.id})`);
      return newDataCore.id;
    } catch (createError) {
      console.error(`❌ Failed to create datacore:`, createError);
      console.error(`   Please create it manually via Flowcore UI or use the MCP create_data_core tool.`);
      console.error(`   Tenant: ${TENANT_ID}`);
      console.error(`   Name: ${DEV_DATA_CORE_NAME}`);
      throw createError;
    }
  }
}

/**
 * Create flow types and event types in the datacore
 */
async function setupFlowTypesAndEventTypes(dataCoreId: string) {
  console.log(`🔍 Setting up flow types and event types...`);

  for (const flowTypeConfig of FLOW_TYPES) {
    try {
      // List flow types to check if it exists
      // Note: SDK may not have ListFlowTypes command, so we'll try to create and handle errors
      let flowType;
      try {
        console.log(`  📦 Creating flow type "${flowTypeConfig.name}"...`);
        const createFlowTypeCommand = new FlowTypeCreateCommand({
          dataCoreId,
          name: flowTypeConfig.name,
          description: flowTypeConfig.description,
        });
        flowType = await client.execute(createFlowTypeCommand);
        console.log(`  ✅ Created flow type "${flowTypeConfig.name}" (ID: ${flowType.id})`);
      } catch (createError: unknown) {
        const errorMessage = createError instanceof Error ? createError.message : String(createError);
        if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
          console.log(`  ✓ Flow type "${flowTypeConfig.name}" already exists`);
          // Try to fetch it to get the ID
          // Note: This might require a different command, for now we'll skip event type creation
          // In practice, you'd use ListFlowTypes or FetchFlowType command
          console.log(`  ⚠️  Cannot verify event types - flow type may already have event types`);
          continue;
        }
        throw createError;
      }

      // Create event types
      for (const eventTypeName of flowTypeConfig.eventTypes) {
        try {
          console.log(`    📦 Creating event type "${eventTypeName}"...`);
          const createEventTypeCommand = new EventTypeCreateCommand({
            flowTypeId: flowType.id,
            name: eventTypeName,
            description: `${eventTypeName} event`,
          });
          await client.execute(createEventTypeCommand);
          console.log(`    ✅ Created event type "${eventTypeName}"`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
            console.log(`    ✓ Event type "${eventTypeName}" already exists`);
          } else {
            console.error(`    ❌ Failed to create event type "${eventTypeName}":`, error);
            // Continue with next event type
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Failed to setup flow type "${flowTypeConfig.name}":`, error);
      // Continue with next flow type
    }
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log("🚀 Setting up CalendRun dev datacore...");
  console.log(`   Tenant: ${TENANT_ID}`);
  console.log(`   DataCore: ${DEV_DATA_CORE_NAME}`);
  console.log("");

  try {
    // Create or verify datacore exists
    const dataCoreId = await createOrVerifyDataCore();
    console.log("");

    // Create flow types and event types
    await setupFlowTypesAndEventTypes(dataCoreId);
    console.log("");

    console.log("✅ Dev datacore setup complete!");
    console.log("");
    console.log(`📋 Configuration:`);
    console.log(`   FLOWCORE_DATA_CORE=${DEV_DATA_CORE_NAME}`);
    console.log(`   FLOWCORE_DATA_CORE_ID=${dataCoreId}`);
    console.log("");
    console.log("💡 Update your .env.development file with the datacore ID above");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

main();
