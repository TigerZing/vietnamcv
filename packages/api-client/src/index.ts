import createClient from "openapi-fetch";

import type { components, paths } from "./schema";

export type { components, paths } from "./schema";

export type ErrorEnvelope = components["schemas"]["ErrorEnvelope"];

/** Typed client for the VietnamCV API, generated from services/api/openapi.json. */
export function createApiClient(
  baseUrl: string,
  init?: { headers?: HeadersInit },
) {
  return createClient<paths>({ baseUrl, headers: init?.headers });
}

export type ApiClient = ReturnType<typeof createApiClient>;
