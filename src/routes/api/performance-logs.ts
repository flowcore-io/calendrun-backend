import { Hono } from "hono";
import {
  getPerformanceLogs,
  getPerformanceLogsByPerformanceId,
} from "../../db/queries/performance-logs";

export const performanceLogsRoute = new Hono();

// GET /api/performance-logs
// Query parameters:
//   - userId (required): User ID to filter logs
//   - startDate (optional): Start date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
//   - endDate (optional): End date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
//   - eventType (optional): Filter by event type (run.logged.0, run.updated.0, run.deleted.0)
//   - limit (optional): Maximum number of results (default: 100)
//   - offset (optional): Number of results to skip (default: 0)
performanceLogsRoute.get("/", async (c) => {
  try {
    const userId = c.req.query("userId");
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");
    const eventType = c.req.query("eventType") as
      | "run.logged.0"
      | "run.updated.0"
      | "run.deleted.0"
      | undefined;
    const limit = c.req.query("limit") ? Number.parseInt(c.req.query("limit") ?? "100") : 100;
    const offset = c.req.query("offset") ? Number.parseInt(c.req.query("offset") ?? "0") : 0;

    if (!userId) {
      return c.json({ error: "userId query parameter is required" }, 400);
    }

    // Validate eventType if provided
    if (eventType && !["run.logged.0", "run.updated.0", "run.deleted.0"].includes(eventType)) {
      return c.json(
        {
          error: "eventType must be one of: run.logged.0, run.updated.0, run.deleted.0",
        },
        400
      );
    }

    // Validate limit and offset
    if (limit < 1 || limit > 1000) {
      return c.json({ error: "limit must be between 1 and 1000" }, 400);
    }

    if (offset < 0) {
      return c.json({ error: "offset must be >= 0" }, 400);
    }

    const logs = await getPerformanceLogs({
      userId,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
      eventType: eventType ?? undefined,
      limit,
      offset,
    });

    return c.json({
      logs,
      count: logs.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching performance logs:", error);
    return c.json({ error: "Failed to fetch performance logs" }, 500);
  }
});

// GET /api/performance-logs/:performanceId
// Get all logs for a specific performance ID
performanceLogsRoute.get("/:performanceId", async (c) => {
  try {
    const performanceId = c.req.param("performanceId");

    if (!performanceId) {
      return c.json({ error: "performanceId parameter is required" }, 400);
    }

    const logs = await getPerformanceLogsByPerformanceId(performanceId);

    return c.json({
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Error fetching performance logs:", error);
    return c.json({ error: "Failed to fetch performance logs" }, 500);
  }
});
