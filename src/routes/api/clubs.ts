import { Hono } from "hono";
import { pool } from "../../db/pool";
import { getTableName } from "../../db/table-names";

export const clubsRoute = new Hono();

// GET /api/clubs
clubsRoute.get("/", async (c) => {
  try {
    const userId = c.req.query("userId");
    const inviteToken = c.req.query("inviteToken");

    if (inviteToken) {
      // Get club by invite token
      const clubTable = getTableName("club");
      const result = await pool.unsafe(
        `
        SELECT * FROM ${clubTable}
        WHERE invite_token = $1
        LIMIT 1
      `,
        [inviteToken]
      );
      if (result.length === 0) {
        return c.json({ error: "Club not found" }, 404);
      }
      return c.json(result[0]);
    }

    if (!userId) {
      return c.json({ error: "userId or inviteToken query parameter is required" }, 400);
    }

    // Get clubs where user is a member
    const clubTable = getTableName("club");
    const membershipTable = getTableName("club_membership");
    const clubs = await pool.unsafe(
      `
      SELECT c.* FROM ${clubTable} c
      INNER JOIN ${membershipTable} cm ON c.id = cm.club_id
      WHERE cm.user_id = $1
      ORDER BY c.created_at DESC
    `,
      [userId]
    );
    return c.json(clubs);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return c.json({ error: "Failed to fetch clubs" }, 500);
  }
});

// GET /api/clubs/:id
clubsRoute.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const clubTable = getTableName("club");
    const result = await pool.unsafe(
      `
      SELECT * FROM ${clubTable}
      WHERE id = $1
      LIMIT 1
    `,
      [id]
    );
    if (result.length === 0) {
      return c.json({ error: "Club not found" }, 404);
    }
    return c.json(result[0]);
  } catch (error) {
    console.error("Error fetching club:", error);
    return c.json({ error: "Failed to fetch club" }, 500);
  }
});

// GET /api/clubs/:id/leaderboard
clubsRoute.get("/:id/leaderboard", async (c) => {
  try {
    const clubId = c.req.param("id");
    const year = c.req.query("year");
    const month = c.req.query("month");

    if (!year || !month) {
      return c.json({ error: "year and month query parameters are required" }, 400);
    }

    // Get leaderboard: sum of distances by user for the specified month
    // Join with user table to get full names
    // Deduplicate performance records by (user_id, run_date) before aggregating
    const membershipTable = getTableName("club_membership");
    const userTable = getTableName("user");
    const instanceTable = getTableName("challenge_instance");
    const performanceTable = getTableName("performance");
    const leaderboard = await pool.unsafe(
      `
      SELECT 
        cm.user_id,
        COALESCE(u.name, cm.user_name) as user_name,
        SUM(deduped_p.distance_km) as total_distance_km,
        COUNT(deduped_p.id) as run_count
      FROM ${membershipTable} cm
      LEFT JOIN ${userTable} u ON u.id = cm.user_id
      LEFT JOIN ${instanceTable} ci ON ci.user_id = cm.user_id
      LEFT JOIN (
        SELECT DISTINCT ON (user_id, run_date) *
        FROM ${performanceTable}
        WHERE EXTRACT(YEAR FROM run_date) = $2::int
          AND EXTRACT(MONTH FROM run_date) = $3::int
          AND status = 'completed'
        ORDER BY user_id, run_date DESC, updated_at DESC
      ) deduped_p ON deduped_p.instance_id = ci.id
      WHERE cm.club_id = $1
      GROUP BY cm.user_id, u.name, cm.user_name
      ORDER BY total_distance_km DESC NULLS LAST
    `,
      [clubId, year, month]
    );

    return c.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return c.json({ error: "Failed to fetch leaderboard" }, 500);
  }
});

// GET /api/clubs/:id/members
clubsRoute.get("/:id/members", async (c) => {
  try {
    const clubId = c.req.param("id");
    const membershipTable = getTableName("club_membership");
    const members = await pool.unsafe(
      `
      SELECT * FROM ${membershipTable}
      WHERE club_id = $1
      ORDER BY joined_at ASC
    `,
      [clubId]
    );
    return c.json(members);
  } catch (error) {
    console.error("Error fetching club members:", error);
    return c.json({ error: "Failed to fetch club members" }, 500);
  }
});

// GET /api/clubs/:id/members/:userId
clubsRoute.get("/:id/members/:userId", async (c) => {
  try {
    const clubId = c.req.param("id");
    const userId = c.req.param("userId");
    const membershipTable = getTableName("club_membership");
    const result = await pool.unsafe(
      `
      SELECT * FROM ${membershipTable}
      WHERE club_id = $1 AND user_id = $2
      LIMIT 1
    `,
      [clubId, userId]
    );
    if (result.length === 0) {
      return c.json({ error: "Membership not found" }, 404);
    }
    return c.json(result[0]);
  } catch (error) {
    console.error("Error fetching membership:", error);
    return c.json({ error: "Failed to fetch membership" }, 500);
  }
});

// GET /api/clubs/:id/runs
// Get the most recent run recordings for all runners in a club
clubsRoute.get("/:id/runs", async (c) => {
  try {
    const clubId = c.req.param("id");
    const limit = c.req.query("limit")
      ? Number.parseInt(c.req.query("limit") ?? "50")
      : 50;
    const status = c.req.query("status"); // Optional filter by status

    // Validate limit
    if (limit < 1 || limit > 500) {
      return c.json({ error: "limit must be between 1 and 500" }, 400);
    }

    // Verify club exists
    const clubTable = getTableName("club");
    const clubExists = await pool.unsafe(
      `
      SELECT id FROM ${clubTable} WHERE id = $1 LIMIT 1
    `,
      [clubId]
    );
    if (clubExists.length === 0) {
      return c.json({ error: "Club not found" }, 404);
    }

    // Build query: join club_membership with performance table
    // Get runs for all members of the club, ordered by most recent first
    // Deduplicate by (user_id, run_date) keeping the most recent record
    const membershipTable = getTableName("club_membership");
    const performanceTable = getTableName("performance");
    let whereConditions = `cm.club_id = $1 AND p.status != 'deleted'`;
    const values: unknown[] = [clubId];
    let paramIndex = 2;

    // Add status filter if provided
    if (status) {
      whereConditions += ` AND p.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    // Use subquery to deduplicate, then order final results by most recent
    const sql = `
      SELECT * FROM (
        SELECT DISTINCT ON (p.user_id, p.run_date)
          p.*,
          cm.user_name as member_name,
          cm.role as member_role
        FROM ${membershipTable} cm
        INNER JOIN ${performanceTable} p ON p.user_id = cm.user_id
        WHERE ${whereConditions}
        ORDER BY p.user_id, p.run_date DESC, p.updated_at DESC
      ) AS deduplicated_runs
      ORDER BY updated_at DESC, run_date DESC
      LIMIT $${paramIndex}
    `;
    values.push(limit);

    const query = pool.unsafe(sql, values as never[]);

    const runs = await query;

    return c.json({
      runs,
      count: runs.length,
      limit,
    });
  } catch (error) {
    console.error("Error fetching club runs:", error);
    return c.json({ error: "Failed to fetch club runs" }, 500);
  }
});
