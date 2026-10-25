import { z } from "zod";

/**
 * Validated environment. Importing this module throws at startup if a variable is
 * missing or malformed (see src/instrumentation.ts), naming each offending variable.
 */
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  // Server-side base URL of the FastAPI service (internal network address in Docker).
  API_INTERNAL_URL: z.url(),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse({
    NEXT_PUBLIC_SITE_URL: source.NEXT_PUBLIC_SITE_URL,
    API_INTERNAL_URL: source.API_INTERNAL_URL,
  });
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return result.data;
}

export const env = parseEnv(process.env);
