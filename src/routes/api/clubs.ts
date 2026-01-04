import { Hono } from "hono";
import { pool } from "../../db/pool";

export const clubsRoute = new Hono();

// GET /api/clubs
clubsRoute.get("/", async (c) => {
  try {
    const userId = c.req.query("userId");
    const inviteToken = c.req.query("inviteToken");

    if (inviteToken) {
      // Get club by invite token
      const result = await pool`
        SELECT * FROM club
        WHERE invite_token = ${inviteToken}
        LIMIT 1
      `;
      if (result.length === 0) {
        return c.json({ error: "Club not found" }, 404);
      }
      return c.json(result[0]);
    }

    if (!userId) {
      return c.json({ error: "userId or inviteToken query parameter is required" }, 400);
    }

    // Get clubs where user is a member
    const clubs = await pool`
      SELECT c.* FROM club c
      INNER JOIN club_membership cm ON c.id = cm.club_id
      WHERE cm.user_id = ${userId}
      ORDER BY c.created_at DESC
    `;
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
    const result = await pool`
      SELECT * FROM club
      WHERE id = ${id}
      LIMIT 1
    `;
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
    const leaderboard = await pool`
      SELECT 
        cm.user_id,
        COALESCE(u.name, cm.user_name) as user_name,
        SUM(p.distance_km) as total_distance_km,
        COUNT(p.id) as run_count
      FROM club_membership cm
      LEFT JOIN "user" u ON u.id = cm.user_id
      LEFT JOIN challenge_instance ci ON ci.user_id = cm.user_id
      LEFT JOIN performance p ON p.instance_id = ci.id
        AND EXTRACT(YEAR FROM p.run_date) = ${year}::int
        AND EXTRACT(MONTH FROM p.run_date) = ${month}::int
        AND p.status = 'completed'
      WHERE cm.club_id = ${clubId}
      GROUP BY cm.user_id, u.name, cm.user_name
      ORDER BY total_distance_km DESC NULLS LAST
    `;

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
    const members = await pool`
      SELECT * FROM club_membership
      WHERE club_id = ${clubId}
      ORDER BY joined_at ASC
    `;
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
    const result = await pool`
      SELECT * FROM club_membership
      WHERE club_id = ${clubId} AND user_id = ${userId}
      LIMIT 1
    `;
    if (result.length === 0) {
      return c.json({ error: "Membership not found" }, 404);
    }
    return c.json(result[0]);
  } catch (error) {
    console.error("Error fetching membership:", error);
    return c.json({ error: "Failed to fetch membership" }, 500);
  }
});
