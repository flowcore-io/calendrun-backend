import { Hono } from "hono";
import { pool } from "../../db/pool";

export const discountBundlesRoute = new Hono();

// GET /api/discount-bundles
discountBundlesRoute.get("/", async (c) => {
  try {
    const clubName = c.req.query("clubName");
    const purchasedBy = c.req.query("purchasedBy");

    let bundles: unknown[];
    if (clubName && purchasedBy) {
      bundles = (await pool`
        SELECT * FROM discount_bundle
        WHERE club_name = ${clubName} AND purchased_by = ${purchasedBy}
        ORDER BY created_at DESC
      `) as unknown as unknown[];
    } else if (clubName) {
      bundles = (await pool`
        SELECT * FROM discount_bundle
        WHERE club_name = ${clubName}
        ORDER BY created_at DESC
      `) as unknown as unknown[];
    } else if (purchasedBy) {
      bundles = (await pool`
        SELECT * FROM discount_bundle
        WHERE purchased_by = ${purchasedBy}
        ORDER BY created_at DESC
      `) as unknown as unknown[];
    } else {
      bundles = (await pool`
        SELECT * FROM discount_bundle
        ORDER BY created_at DESC
      `) as unknown as unknown[];
    }

    return c.json(bundles);
  } catch (error) {
    console.error("Error fetching discount bundles:", error);
    return c.json({ error: "Failed to fetch discount bundles" }, 500);
  }
});

// GET /api/discount-bundles/:id
discountBundlesRoute.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await pool`
      SELECT * FROM discount_bundle
      WHERE id = ${id}
      LIMIT 1
    `;
    if (result.length === 0) {
      return c.json({ error: "Discount bundle not found" }, 404);
    }
    return c.json(result[0]);
  } catch (error) {
    console.error("Error fetching discount bundle:", error);
    return c.json({ error: "Failed to fetch discount bundle" }, 500);
  }
});
