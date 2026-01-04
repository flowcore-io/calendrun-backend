import type { Context, Next } from "hono";
import { env } from "../env";

/**
 * API Key authentication middleware
 * Validates that requests include a valid API key in the Authorization header
 * Format: Authorization: Bearer <api-key>
 * or: X-API-Key: <api-key>
 */
export async function apiKeyAuth(c: Context, next: Next) {
  // Skip API key check if not configured (for development)
  if (!env.BACKEND_API_KEY) {
    console.warn("⚠️  BACKEND_API_KEY not set - API key authentication disabled");
    return next();
  }

  // Get API key from Authorization header (Bearer token) or X-API-Key header
  const authHeader = c.req.header("Authorization");
  const apiKeyHeader = c.req.header("X-API-Key");

  let providedKey: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    providedKey = authHeader.substring(7);
  } else if (apiKeyHeader) {
    providedKey = apiKeyHeader;
  }

  if (!providedKey) {
    return c.json(
      {
        error: "Unauthorized",
        message: "API key required. Provide via Authorization: Bearer <key> or X-API-Key header",
      },
      401
    );
  }

  if (providedKey !== env.BACKEND_API_KEY) {
    return c.json({ error: "Unauthorized", message: "Invalid API key" }, 401);
  }

  return next();
}
