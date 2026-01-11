import { Hono } from "hono";
import { pool } from "../../db/pool";
import { getTableName } from "../../db/table-names";

export const usersRoute = new Hono();

// GET /api/users
// Fetch users by IDs (comma-separated) or all users if no IDs provided
usersRoute.get("/", async (c) => {
  try {
    const userIdsParam = c.req.query("userIds");

    if (userIdsParam) {
      // Fetch specific users by IDs
      const userIds = userIdsParam
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
      if (userIds.length === 0) {
        return c.json([]);
      }

      const userTable = getTableName("user");
      const users = await pool.unsafe(
        `SELECT id, name, email, created_at, updated_at
        FROM "${userTable}"
        WHERE id = ANY($1)
        ORDER BY name ASC NULLS LAST`,
        [userIds]
      );
      return c.json(users);
    }

    // If no userIds provided, return all users (for leaderboard use case)
    const userTable = getTableName("user");
    const users = await pool.unsafe(
      `SELECT id, name, email, created_at, updated_at
      FROM "${userTable}"
      ORDER BY name ASC NULLS LAST`
    );
    return c.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});
