import { baseExtensions } from "@/components/rich-text-editor/Extensions";
import { renderToMarkdown } from "@tiptap/static-renderer/pm/markdown";

function normalizeWhiteSpace(markdown: string) {
  return markdown
    .replace(/\s+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function tipTapToJsonMarkdown(json: string) {
  let content;
  try {
    content = JSON.parse(json);
  } catch {
    return "";
  }

  const markdown = renderToMarkdown({
    extensions: baseExtensions,
    content: content,
  });

  return normalizeWhiteSpace(markdown);
}
