"use client";

import {
  converJsonToHtml,
  type SerializableEditorContent,
} from "@/lib/json-to-html";
import DOMPurify from "dompurify";
import parse from "html-react-parser";

interface iAppProps {
  content: SerializableEditorContent;
  className?: string;
}

export function SaveContent({ content, className }: iAppProps) {
  const html = converJsonToHtml(content);
  const clean = DOMPurify.sanitize(html);
  return <div className={className}>{parse(clean)}</div>;
}
