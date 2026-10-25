import { z } from "zod";

/**
 * Validated environment. Importing this module throws at startup if a variable is
 * missing or malformed (see src/instrumentation.ts), naming each offending variable.
 */
const schema = z
  .object({
    NEXT_PUBLIC_SITE_URL: z.url(),
    // Server-side base URL of the FastAPI service (internal network address in Docker).
    API_INTERNAL_URL: z.url(),
    // Google sign-in for comments (ADR-009). Both or neither; unset hides the option.
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  })
  .refine(
    (value) =>
      Boolean(value.GOOGLE_CLIENT_ID) === Boolean(value.GOOGLE_CLIENT_SECRET),
    {
      message: "set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither",
      path: ["GOOGLE_CLIENT_SECRET"],
    },
  );

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const blankToUndefined = (value: string | undefined) =>
    value && value.trim() !== "" ? value : undefined;
  const result = schema.safeParse({
    NEXT_PUBLIC_SITE_URL: source.NEXT_PUBLIC_SITE_URL,
    API_INTERNAL_URL: source.API_INTERNAL_URL,
    GOOGLE_CLIENT_ID: blankToUndefined(source.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: blankToUndefined(source.GOOGLE_CLIENT_SECRET),
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

export const googleSignInEnabled = Boolean(env.GOOGLE_CLIENT_ID);
