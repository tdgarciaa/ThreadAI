"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { editorExtensions } from "./Extensions";
import { MenuBar } from "./MenuBar";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

interface AppProps {
  field: {
    value: string;
    onChange: (next: string) => void;
    onBlur?: () => void;
  };
  sendButton?: ReactNode;
  footerLeft?: ReactNode;
}

function parseEditorContent(value: string) {
  if (!value) {
    return "";
  }

  try {
    return JSON.parse(value);
  } catch {
    return "";
  }
}

export function RichTextEditor({ field, sendButton, footerLeft }: AppProps) {
  const isMountedRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: () => parseEditorContent(field.value),
    onBlur: field.onBlur,
    onUpdate: ({ editor }) => {
      if (isMountedRef.current) {
        field.onChange(JSON.stringify(editor.getJSON()));
      }
    },
    editorProps: {
      attributes: {
        class:
          "max-w-none min-h-[125px] focus:outline-none p-4 prose dark:prose-invert marker:text-primary",
      },
    },
  });

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent = parseEditorContent(field.value);
    const currentContent = JSON.stringify(editor.getJSON());
    const nextContentString =
      typeof nextContent === "string" ? nextContent : JSON.stringify(nextContent);

    if (currentContent !== nextContentString) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [editor, field.value]);

  return (
    <div className="relative w-full border border-input rounded-lg overflow-hidden dark:bg-input/30 flex flex-col">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="max-h-50 overflow-y-auto" />
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-input bg-card">
        <div className="min-h-8 flex items-center"> {footerLeft}</div>
        <div className="shrink-0">{sendButton}</div>
      </div>
    </div>
  );
}
