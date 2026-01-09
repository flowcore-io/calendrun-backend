import { Hono } from "hono";
import { pool } from "../../db/pool";
import { getTableName } from "../../db/table-names";

export const runsRoute = new Hono();

// GET /api/runs
runsRoute.get("/", async (c) => {
  try {
    const instanceId = c.req.query("instanceId");
    const userId = c.req.query("userId");
    const runDate = c.req.query("runDate");
    const status = c.req.query("status");

    // Build WHERE conditions
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (instanceId) {
      conditions.push(`instance_id = $${paramIndex}`);
      values.push(instanceId);
      paramIndex++;
    }
    if (userId) {
      conditions.push(`user_id = $${paramIndex}`);
      values.push(userId);
      paramIndex++;
    }
    if (runDate) {
      conditions.push(`run_date = $${paramIndex}::date`);
      values.push(runDate);
      paramIndex++;
    }
    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const performanceTable = getTableName("performance");

    // Deduplicate by (user_id, run_date) keeping the most recent record
    // If instanceId is provided, deduplicate by (instance_id, user_id, run_date)
    let sql: string;
    if (instanceId) {
      sql = `
        SELECT DISTINCT ON (instance_id, user_id, run_date) *
        FROM ${performanceTable}
        ${whereClause}
        ORDER BY instance_id, user_id, run_date DESC, updated_at DESC
      `;
    } else {
      sql = `
        SELECT DISTINCT ON (user_id, run_date) *
        FROM ${performanceTable}
        ${whereClause}
        ORDER BY user_id, run_date DESC, updated_at DESC
      `;
    }

    const runs = await pool.unsafe(sql, values as never[]);
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
    const performanceTable = getTableName("performance");
    const result = await pool.unsafe(
      `
      SELECT * FROM ${performanceTable}
      WHERE id = $1
      LIMIT 1
    `,
      [id]
    );
    if (result.length === 0) {
      return c.json({ error: "Run not found" }, 404);
    }
    return c.json(result[0]);
  } catch (error) {
    console.error("Error fetching run:", error);
    return c.json({ error: "Failed to fetch run" }, 500);
  }
});
