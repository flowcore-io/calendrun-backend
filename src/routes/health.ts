import { Hono } from "hono";

export const healthRoute = new Hono().get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
    version: "1.6.1",
  });
});
