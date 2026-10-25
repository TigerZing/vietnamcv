import { parseArticleBody } from "@/lib/article-body";

/** Renders post text as plain elements; the text is never interpreted as HTML. */
export function ArticleBody({ body }: { body: string }) {
  return (
    <div className="flex flex-col gap-4 text-base leading-relaxed">
      {parseArticleBody(body).map((block, index) => {
        const key = `${block.kind}-${index}`;
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
    </div>
  );
}
