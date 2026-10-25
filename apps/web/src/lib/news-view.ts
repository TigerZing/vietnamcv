// Shared by server and client components (no server-only imports).

export type NewsView = "list" | "grid";
export const GRID_COLUMNS = [2, 3, 4] as const;
export type GridColumns = (typeof GRID_COLUMNS)[number];

export const DEFAULT_VIEW: NewsView = "list";
export const DEFAULT_COLUMNS: GridColumns = 3;

export type NewsViewState = { view: NewsView; cols: GridColumns };

/** Reads the list layout from the URL; anything unexpected falls back to the default. */
export function parseNewsView(params: {
  view?: string | string[];
  cols?: string | string[];
}): NewsViewState {
  const view = params.view === "grid" ? "grid" : DEFAULT_VIEW;
  const cols = GRID_COLUMNS.find((value) => String(value) === params.cols);
  return { view, cols: cols ?? DEFAULT_COLUMNS };
}

/** Query string for a layout, leaving out defaults so the plain URL stays canonical. */
export function newsViewQuery(state: NewsViewState): Record<string, string> {
  if (state.view === "list") return {};
  return state.cols === DEFAULT_COLUMNS
    ? { view: "grid" }
    : { view: "grid", cols: String(state.cols) };
}

// Phones always get one column; the chosen count applies from the large breakpoint.
const GRID_CLASSES: Record<GridColumns, string> = {
  2: "grid gap-6 sm:grid-cols-2",
  3: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

const GRID_SIZES: Record<GridColumns, string> = {
  2: "(min-width: 640px) 50vw, 100vw",
  3: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  4: "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
};

export function gridClass(cols: GridColumns): string {
  return GRID_CLASSES[cols];
}

export function gridImageSizes(cols: GridColumns): string {
  return GRID_SIZES[cols];
}
