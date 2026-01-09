import { initializeSchema } from "../src/db/migrations";

async function main() {
  try {
    await initializeSchema();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
