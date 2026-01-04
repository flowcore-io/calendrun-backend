import { Hono } from "hono";
import { pool } from "../../db/pool";

export const discountCodesRoute = new Hono();

// GET /api/discount-codes
discountCodesRoute.get("/", async (c) => {
  try {
    const code = c.req.query("code");
    const bundleId = c.req.query("bundleId");
    const userId = c.req.query("userId");

    let codes: unknown[];
    if (code) {
      codes = (await pool`
        SELECT * FROM discount_code
        WHERE code = ${code}
        ORDER BY created_at DESC
      `) as unknown as unknown[];
    } else if (bundleId) {
      codes = (await pool`
        SELECT * FROM discount_code
        WHERE bundle_id = ${bundleId}
        ORDER BY created_at DESC
      `) as unknown as unknown[];
    } else if (userId) {
      codes = (await pool`
        SELECT * FROM discount_code
        WHERE redeemed_by = ${userId}
        ORDER BY created_at DESC
      `) as unknown as unknown[];
    } else {
      codes = (await pool`
        SELECT * FROM discount_code
        ORDER BY created_at DESC
      `) as unknown as unknown[];
    }

    return c.json(codes);
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    return c.json({ error: "Failed to fetch discount codes" }, 500);
  }
});

// GET /api/discount-codes/:id
discountCodesRoute.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await pool`
      SELECT * FROM discount_code
      WHERE id = ${id}
      LIMIT 1
    `;
    if (result.length === 0) {
      return c.json({ error: "Discount code not found" }, 404);
    }
    return c.json(result[0]);
  } catch (error) {
    console.error("Error fetching discount code:", error);
    return c.json({ error: "Failed to fetch discount code" }, 500);
  }
});

// GET /api/discount-codes/validate/:code
discountCodesRoute.get("/validate/:code", async (c) => {
  try {
    const code = c.req.param("code");
    const result = await pool`
      SELECT * FROM discount_code
      WHERE code = ${code}
      LIMIT 1
    `;
    if (result.length === 0) {
      return c.json({ error: "Discount code not found" }, 404);
    }
    return c.json(result[0]);
  } catch (error) {
    console.error("Error validating discount code:", error);
    return c.json({ error: "Failed to validate discount code" }, 500);
  }
});
