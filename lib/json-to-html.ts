import { baseExtensions } from "@/components/rich-text-editor/Extensions";
import { generateHTML, type JSONContent } from "@tiptap/react";

export type SerializableEditorContent = JSONContent | string | null | undefined;

export function converJsonToHtml(
  jsonContent: SerializableEditorContent,
): string {
  if (!jsonContent) {
    return "";
  }

  try {
    const content =
      typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;
    return generateHTML(content, baseExtensions);
  } catch {
    console.log("Error convertig json to html");
    return "";
  }
}
