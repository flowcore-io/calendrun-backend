import { Hono } from "hono";
import { cors } from "hono/cors";
import { initializeSchema } from "./db/migrations";
import { env } from "./env";
import { apiKeyAuth } from "./middleware/api-key";
import { challengesRoute } from "./routes/api/challenges";
import { clubsRoute } from "./routes/api/clubs";
import { discountBundlesRoute } from "./routes/api/discount-bundles";
import { discountCodesRoute } from "./routes/api/discount-codes";
import { performanceLogsRoute } from "./routes/api/performance-logs";
import { runsRoute } from "./routes/api/runs";
import { subscriptionsRoute } from "./routes/api/subscriptions";
import { userRoute } from "./routes/api/user";
import { usersRoute } from "./routes/api/users";
import { healthRoute } from "./routes/health";
import { processLastTimeBuckets, startPolling } from "./services/event-streamer";

const app = new Hono();

// CORS middleware
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN ?? "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);

// Health check route (no auth required)
app.route("/health", healthRoute);

// API routes (require API key authentication)
app.use("/api/*", apiKeyAuth);
app.route("/api/challenges", challengesRoute);
app.route("/api/clubs", clubsRoute);
app.route("/api/subscriptions", subscriptionsRoute);
app.route("/api/user", userRoute);
app.route("/api/users", usersRoute);
app.route("/api/discount-codes", discountCodesRoute);
app.route("/api/discount-bundles", discountBundlesRoute);
app.route("/api/runs", runsRoute);
app.route("/api/performance-logs", performanceLogsRoute);

// Start server
async function main() {
  console.log("🚀 Starting CalendRun Backend...");

  try {
    // Initialize read model schema (projection tables)
    await initializeSchema();

    // Process backlog on startup (if enabled)
    if (env.PROCESS_BACKLOG_ON_STARTUP) {
      await processLastTimeBuckets(env.BACKLOG_TIME_BUCKETS);
    } else {
      console.log("ℹ️  Skipping backlog processing on startup (PROCESS_BACKLOG_ON_STARTUP=false)");
    }

    // Start polling loop
    await startPolling();

    // Start HTTP server
    const port = Number.parseInt(env.PORT);
    // @ts-expect-error - Bun is available at runtime but types may not be installed
    Bun.serve({
      port,
      fetch: app.fetch,
    });

    console.log(`✅ Server running on port ${port}`);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

main();
