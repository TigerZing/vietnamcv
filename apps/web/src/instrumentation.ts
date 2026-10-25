// Runs once when the server starts: fail fast on invalid configuration.
export async function register() {
  await import("./lib/env");
}
