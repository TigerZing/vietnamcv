// Shared by server and client components (no server-only imports).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isMediaId(value: string): boolean {
  return UUID.test(value);
}

/** Same-origin URL of a stored image; served by src/app/api/media/[id]/route.ts. */
export function mediaSrc(id: string): string {
  return `/api/media/${encodeURIComponent(id)}`;
}
