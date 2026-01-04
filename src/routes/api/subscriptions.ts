import { Hono } from "hono";
import { pool } from "../../db/pool";

export const subscriptionsRoute = new Hono();

// GET /api/subscriptions
subscriptionsRoute.get("/", async (c) => {
  try {
    const userId = c.req.query("userId");
    if (!userId) {
      return c.json({ error: "userId query parameter is required" }, 400);
    }

    const result = await pool`
      SELECT * FROM subscription
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return c.json(null);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return c.json({ error: "Failed to fetch subscription" }, 500);
  }
});
