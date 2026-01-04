import { Hono } from "hono";
import packageJson from "../../package.json";

export const healthRoute = new Hono().get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
    version: packageJson.version,
  });
});
