import { Hono } from "hono";
import { pool } from "../../db/pool";
import {
  getChallengeInstanceById,
  getChallengeInstancesByTemplateId,
  getChallengeInstancesByUserId,
} from "../../db/queries/challenge-instances";
import { getPerformancesByInstance } from "../../db/queries/performances";

export const challengesRoute = new Hono();

// GET /api/challenges/templates
challengesRoute.get("/templates", async (c) => {
  try {
    const templates = await pool`
      SELECT * FROM challenge_template
      ORDER BY start_date DESC
    `;
    return c.json(templates);
  } catch (error) {
    console.error("Error fetching challenge templates:", error);
    return c.json({ error: "Failed to fetch challenge templates" }, 500);
  }
});

// GET /api/challenges/templates/:id
challengesRoute.get("/templates/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await pool`
      SELECT * FROM challenge_template
      WHERE id = ${id}
      LIMIT 1
    `;
    if (result.length === 0) {
      return c.json({ error: "Challenge template not found" }, 404);
    }
    return c.json(result[0]);
  } catch (error) {
    console.error("Error fetching challenge template:", error);
    return c.json({ error: "Failed to fetch challenge template" }, 500);
  }
});

// GET /api/challenges/instances
challengesRoute.get("/instances", async (c) => {
  try {
    const userId = c.req.query("userId");
    const templateId = c.req.query("templateId");

    if (templateId) {
      const instances = await getChallengeInstancesByTemplateId(templateId);
      return c.json(instances);
    }

    if (!userId) {
      return c.json({ error: "userId or templateId query parameter is required" }, 400);
    }
    const instances = await getChallengeInstancesByUserId(userId);
    return c.json(instances);
  } catch (error) {
    console.error("Error fetching challenge instances:", error);
    return c.json({ error: "Failed to fetch challenge instances" }, 500);
  }
});

// GET /api/challenges/instances/:id
challengesRoute.get("/instances/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const instance = await getChallengeInstanceById(id);
    if (!instance) {
      return c.json({ error: "Challenge instance not found" }, 404);
    }
    return c.json(instance);
  } catch (error) {
    console.error("Error fetching challenge instance:", error);
    return c.json({ error: "Failed to fetch challenge instance" }, 500);
  }
});

// GET /api/challenges/:instanceId/runs
challengesRoute.get("/:instanceId/runs", async (c) => {
  try {
    const instanceId = c.req.param("instanceId");
    const runs = await getPerformancesByInstance(instanceId);
    return c.json(runs);
  } catch (error) {
    console.error("Error fetching runs:", error);
    return c.json({ error: "Failed to fetch runs" }, 500);
  }
});
