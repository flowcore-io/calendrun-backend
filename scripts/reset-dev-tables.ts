import { resetDevTables } from "../src/db/migrations-dev";

async function main() {
  try {
    await resetDevTables();
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  }
}

main();
