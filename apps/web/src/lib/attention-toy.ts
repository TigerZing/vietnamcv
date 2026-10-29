import type { Messages } from "next-intl";

/**
 * The toy self-attention behind the Transformer playground: a 4 × 4 image whose patches
 * carry hand-written content vectors. Scores are q · k / √d with q = k = the patch vector
 * (identity projections), optionally plus a relative position bias that favours nearby
 * patches, then a softmax over all 16 patches. Small enough to check by hand.
 */

export type PatchKind =
  keyof Messages["Knowledge"]["transformer"]["playground"]["kinds"];

export const GRID = 4;

/** Row by row, top to bottom; matches the drawing in `attention-playground.tsx`. */
// prettier-ignore
export const PATCH_KINDS: readonly PatchKind[] = [
  "sky", "sky", "sky", "sun",
  "grass", "cat", "cat", "tree",
  "grass", "cat", "cat", "tree",
  "grass", "grass", "grass", "grass",
];

const KIND_ORDER: readonly PatchKind[] = ["sky", "sun", "cat", "tree", "grass"];

/** Strong component for the patch's own kind, a small shared one for everything else. */
export function patchVector(kind: PatchKind): number[] {
  return KIND_ORDER.map((other) => (other === kind ? 3 : 0.5));
}

export function patchKind(index: number): PatchKind {
  const kind = PATCH_KINDS[index];
  if (kind === undefined) throw new RangeError(`No patch ${index}`);
  return kind;
}

/** 1-based row and column, as the copy names them. */
export function patchPosition(index: number): { row: number; col: number } {
  return { row: Math.floor(index / GRID) + 1, col: (index % GRID) + 1 };
}

/** Score penalty per squared patch distance when the position bias is on. */
export const POSITION_BIAS = 0.8;

export function attentionWeights(
  query: number,
  withPositionBias: boolean,
): number[] {
  const vectors = PATCH_KINDS.map(patchVector);
  const scale = Math.sqrt(KIND_ORDER.length);
  const q = patchVector(patchKind(query));
  const scores = vectors.map((k, index) => {
    const dot = q.reduce((sum, value, i) => sum + value * (k[i] ?? 0), 0);
    const bias = withPositionBias
      ? -POSITION_BIAS * squaredDistance(query, index)
      : 0;
    return dot / scale + bias;
  });
  return softmax(scores);
}

export function softmax(scores: readonly number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((score) => Math.exp(score - max));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
}

function squaredDistance(a: number, b: number): number {
  const dr = Math.floor(a / GRID) - Math.floor(b / GRID);
  const dc = (a % GRID) - (b % GRID);
  return dr * dr + dc * dc;
}

/**
 * Weights as whole percentages that add up to exactly 100 (largest remainder), so the
 * numbers on the grid match the "always 100%" promise in the copy.
 */
export function toPercentages(weights: readonly number[]): number[] {
  const raw = weights.map((weight) => weight * 100);
  const floors = raw.map(Math.floor);
  const missing = 100 - floors.reduce((sum, value) => sum + value, 0);
  const roundedUp = new Set(
    raw
      .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
      .sort((a, b) => b.remainder - a.remainder)
      .slice(0, missing)
      .map(({ index }) => index),
  );
  return floors.map((value, index) =>
    roundedUp.has(index) ? value + 1 : value,
  );
}
