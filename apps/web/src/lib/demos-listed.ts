import "server-only";

import { api } from "./api";
import { type Demo, DEMOS, demoThread } from "./demos";

/**
 * The demos still on the site: `DEMOS` minus the ones an admin deleted (ADR-015).
 * Request-time: call inside Suspense. If the API cannot be reached the full list is
 * shown, so an outage never empties the page.
 */
export async function listedDemos(): Promise<readonly Demo[]> {
  try {
    const { data, response } = await api.GET("/api/v1/demos", {
      cache: "no-store",
    });
    if (!data) {
      console.error("demo_list_failed", response.status);
      return DEMOS;
    }
    const published = new Set(data.items);
    return DEMOS.filter((demo) => published.has(demoThread(demo).slug));
  } catch (error) {
    console.error("demo_list_failed", error);
    return DEMOS;
  }
}
