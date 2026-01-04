import { Hono } from "hono";
import { pool } from "../../db/pool";

export const runsRoute = new Hono();

// GET /api/runs
runsRoute.get("/", async (c) => {
  try {
    const instanceId = c.req.query("instanceId");
    const userId = c.req.query("userId");
    const runDate = c.req.query("runDate");
    const status = c.req.query("status");

    let query = pool`SELECT * FROM performance WHERE 1=1`;

    if (instanceId) {
      query = pool`${query} AND instance_id = ${instanceId}`;
    }
    if (userId) {
      query = pool`${query} AND user_id = ${userId}`;
    }
    if (runDate) {
      query = pool`${query} AND run_date = ${runDate}::date`;
    }
    if (status) {
      query = pool`${query} AND status = ${status}`;
    }

    query = pool`${query} ORDER BY run_date DESC, created_at DESC`;

    const runs = await query;
    return c.json(runs);
  } catch (error) {
    console.error("Error fetching runs:", error);
    return c.json({ error: "Failed to fetch runs" }, 500);
  }
});

// GET /api/runs/:id
runsRoute.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await pool`
      SELECT * FROM performance
      WHERE id = ${id}
      LIMIT 1
    `;
    if (result.length === 0) {
      return c.json({ error: "Run not found" }, 404);
    }
    return c.json(result[0]);
  } catch (error) {
    console.error("Error fetching run:", error);
    return c.json({ error: "Failed to fetch run" }, 500);
  }
});
