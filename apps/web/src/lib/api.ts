import "server-only";

import { createApiClient, type ErrorEnvelope } from "@vietnamcv/api-client";

import { env } from "./env";

/** Error raised for non-2xx API responses, carrying the API's error envelope. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId: string | null,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static fromEnvelope(status: number, body: unknown): ApiError {
    const envelope = body as Partial<ErrorEnvelope> | undefined;
    const error = envelope?.error;
    return new ApiError(
      status,
      error?.code ?? "UNKNOWN_ERROR",
      error?.message ?? `API request failed with status ${status}`,
      error?.request_id ?? null,
    );
  }
}

/** Server-side API client. Never import from client components (enforced by server-only). */
export const api = createApiClient(env.API_INTERNAL_URL);
