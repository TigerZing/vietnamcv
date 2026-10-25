import {
  ArticleImage,
  type StoredImage,
} from "@/components/news/article-image";
import { parseArticleBody } from "@/lib/article-body";

/**
 * Renders post text as plain elements; the text is never interpreted as HTML.
 * "{{figure:N}}" lines show the Nth figure; figures the text does not place follow it.
 * Placeholders for figures that are missing (for example hidden for rights) show nothing.
 */
export function ArticleBody({
  body,
  figures = [],
}: {
  body: string | null;
  figures?: StoredImage[];
}) {
  const blocks = body ? parseArticleBody(body) : [];
  const placed = new Set(
    blocks.flatMap((block) => (block.kind === "figure" ? [block.index] : [])),
  );
  const rest = figures.filter((_, index) => !placed.has(index + 1));
  return (
    <div className="flex flex-col gap-4 text-base leading-relaxed">
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        if (block.kind === "figure") {
          const figure = figures[block.index - 1];
          return figure ? (
            <ArticleImage key={key} image={figure} inline />
          ) : null;
        }
        if (block.kind === "heading") {
          return (
            <h2 key={key} className="mt-4 text-xl font-semibold text-balance">
              {block.text}
            </h2>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={key} className="flex list-disc flex-col gap-2 pl-6">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={key}>{block.text}</p>;
      })}
      {rest.map((figure) => (
        <ArticleImage key={figure.id} image={figure} inline />
      ))}
    </div>
  );
}
