// Liveness probe for the web container. It does not call the API, so a backend outage
// does not restart healthy web containers.
export function GET() {
  return Response.json({ status: "ok" });
}
