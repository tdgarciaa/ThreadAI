import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { editorExtensions } from "@/components/rich-text-editor/Extensions";
import { generateJSON } from "@tiptap/react";

const md = MarkdownIt({ html: false, linkify: true, breaks: false });

export function MarkdownToJson(markdown: string) {
  const html = md.render(markdown);

  const cleanedHtml = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });

  return generateJSON(cleanedHtml, editorExtensions);
}
