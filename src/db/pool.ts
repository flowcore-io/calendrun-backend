import postgres from "postgres";
import { env } from "../env";

const isProduction = () => env.NODE_ENV === "production";

// Determine if SSL should be required
// - Always require in production
// - Require for remote hosts (not localhost/127.0.0.1)
// - Can be overridden with DATABASE_SSL env var
function shouldRequireSSL(): boolean | "require" {
  // Check for explicit override
  if (process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "require") {
    return "require";
  }
  if (process.env.DATABASE_SSL === "false") {
    return false;
  }

  // Always require in production
  if (isProduction()) {
    return "require";
  }

  // Check if DATABASE_URL is for a remote host
  try {
    const url = new URL(env.DATABASE_URL);
    const hostname = url.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.");

    // Require SSL for remote connections
    return !isLocalhost ? "require" : false;
  } catch {
    // If URL parsing fails, default to requiring SSL for safety
    return "require";
  }
}

export const pool = postgres(env.DATABASE_URL, {
  max: isProduction() ? 20 : 10, // Connection pool size
  idle_timeout: 20, // Seconds before idle connection is closed
  max_lifetime: 60 * 30, // Maximum lifetime of a connection (30 minutes)
  connect_timeout: 10, // Connection timeout in seconds (prevents negative timeout calculation bug)
  connection: {
    application_name: "calendrun-backend",
  },
  ssl: shouldRequireSSL(),
  transform: postgres.camel, // snake_case to camelCase
  onnotice: () => {}, // Suppress notices to reduce noise
});
