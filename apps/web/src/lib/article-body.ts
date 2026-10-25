// Shared by server and client components (no server-only imports).

export type BodyBlock =
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; text: string }
  // An in-article image: figure number `index` (1-based) of the post.
  | { kind: "figure"; index: number };

const FIGURE = /^\{\{figure:([1-9]\d{0,2})\}\}$/;

/**
 * Splits post text into blocks. The format is deliberately small and never produces
 * HTML: paragraphs separated by blank lines, "## " headings, "- " list items and
 * "{{figure:N}}" lines that place the post's Nth image.
 */
export function parseArticleBody(body: string): BodyBlock[] {
  const blocks: BodyBlock[] = [];
  for (const chunk of body.replace(/\r\n?/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const [first] = lines;
    if (first === undefined) continue;
    const figure = lines.length === 1 ? FIGURE.exec(first) : null;
    if (figure) {
      blocks.push({ kind: "figure", index: Number(figure[1]) });
    } else if (lines.length === 1 && first.startsWith("## ")) {
      blocks.push({ kind: "heading", text: first.slice(3).trim() });
    } else if (lines.every((line) => line.startsWith("- "))) {
      blocks.push({
        kind: "list",
        items: lines.map((line) => line.slice(2).trim()),
      });
    } else {
      blocks.push({ kind: "paragraph", text: lines.join(" ") });
    }
  }
  return blocks;
}
