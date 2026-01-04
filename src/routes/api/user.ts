import { Hono } from "hono";
import { getUserSettings } from "../../db/queries/user-settings";

export const userRoute = new Hono();

// GET /api/user/settings
userRoute.get("/settings", async (c) => {
  try {
    const userId = c.req.query("userId");
    if (!userId) {
      return c.json({ error: "userId query parameter is required" }, 400);
    }

    const settings = await getUserSettings(userId);
    if (!settings) {
      return c.json({ preferences: {} });
    }

    return c.json(settings);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return c.json({ error: "Failed to fetch user settings" }, 500);
  }
});

// PATCH /api/user/settings
userRoute.patch("/settings", async (c) => {
  try {
    const userId = c.req.query("userId");
    if (!userId) {
      return c.json({ error: "userId query parameter is required" }, 400);
    }

    const body = await c.req.json();
    const preferences = body.preferences;

    if (!preferences || typeof preferences !== "object") {
      return c.json({ error: "preferences object is required" }, 400);
    }

    // Note: This endpoint doesn't actually update the database directly
    // The frontend should emit a Flowcore event instead
    // This endpoint exists for API consistency but should return an error
    // instructing the client to use Flowcore events
    return c.json(
      {
        error:
          "User settings must be updated via Flowcore events. Use user.settings.updated.0 event type.",
      },
      405
    );
  } catch (error) {
    console.error("Error updating user settings:", error);
    return c.json({ error: "Failed to update user settings" }, 500);
  }
});
