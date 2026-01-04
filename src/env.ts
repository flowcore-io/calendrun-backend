import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("18765"),
  DATABASE_URL: z.string().url(),
  FLOWCORE_TENANT: z.string().default("flowcore-saas"),
  FLOWCORE_DATA_CORE: z.string().default("calendrun"),
  FLOWCORE_API_KEY: z.string(),
  BACKEND_API_KEY: z.string().optional(),
  POLL_INTERVAL: z.string().default("30").transform(Number),
  PROCESS_BACKLOG_ON_STARTUP: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  BACKLOG_TIME_BUCKETS: z.string().default("3").transform(Number),
  NEXTAUTH_SECRET: z.string().optional(),
  KEYCLOAK_ISSUER: z.string().url().optional(),
  CORS_ORIGIN: z.string().url().optional(),
  SKIP_ENV_VALIDATION: z.string().optional(),
});

function getEnv() {
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return process.env as unknown as z.infer<typeof envSchema>;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    process.exit(1);
  }

  return parsed.data;
}

export const env = getEnv();
