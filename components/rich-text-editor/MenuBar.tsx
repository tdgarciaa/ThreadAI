import { Editor, useEditorState } from "@tiptap/react";
import {
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
  TooltipContent,
} from "../ui/tooltip";
import { Toggle } from "../ui/toggle";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  ListIcon,
  ListOrdered,
  Undo,
  Redo,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ComposeAssistant } from "./ComposeAssistant";
import { MarkdownToJson } from "@/lib/markdownToJson";

interface MenuBarProps {
  editor: Editor | null;
}
export function MenuBar({ editor }: MenuBarProps) {
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return {
          isBold: false,
          isItalic: false,
          isStrike: false,
          isCodeBlock: false,
          isBulletList: false,
          isOrderedList: false,
          canUndo: false,
          canRedo: false,
          currentContent: null,
        };
      }

      return {
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isStrike: editor.isActive("strike"),
        isCodeBlock: editor.isActive("codeBlock"),
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        currentContent: editor.getJSON(),
      };
    },
  });

  if (!editor || !editorState) {
    return null;
  }

  const handleAcceptCompose = (markdown: string) => {
    try {
      const json = MarkdownToJson(markdown);
      editor.commands.setContent(json);
    } catch {
      return;
    }
  };

  return (
    <div className="border border-input border-t-0 border-x-0 rounded-t-lg p-2 bg-card flex flex-wrap">
      <TooltipProvider>
        <div className="flex flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                type="button"
                size="sm"
                pressed={editorState.isBold}
                onMouseDown={(event) => event.preventDefault()}
                onPressedChange={() =>
                  editor.chain().focus().toggleBold().run()
                }
                className={cn(
                  editorState.isBold && "bg-muted text-foreground-muted",
                )}
              >
                <Bold />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                type="button"
                size="sm"
                pressed={editorState.isItalic}
                onMouseDown={(event) => event.preventDefault()}
                onPressedChange={() =>
                  editor.chain().focus().toggleItalic().run()
                }
                className={cn(
                  editorState.isItalic && "bg-muted text-foreground-muted",
                )}
              >
                <Italic />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                type="button"
                size="sm"
                pressed={editorState.isStrike}
                onMouseDown={(event) => event.preventDefault()}
                onPressedChange={() =>
                  editor.chain().focus().toggleStrike().run()
                }
                className={cn(
                  editorState.isStrike && "bg-muted text-foreground-muted",
                )}
              >
                <Strikethrough />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Strike</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                type="button"
                size="sm"
                pressed={editorState.isCodeBlock}
                onMouseDown={(event) => event.preventDefault()}
                onPressedChange={() =>
                  editor.chain().focus().toggleCodeBlock().run()
                }
                className={cn(
                  editorState.isCodeBlock && "bg-muted text-foreground-muted",
                )}
              >
                <Code />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Code</TooltipContent>
          </Tooltip>
        </div>
        <div className="w-px h-7 bg-border mx-2 "></div>
        <div className="flex flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                type="button"
                size="sm"
                pressed={editorState.isBulletList}
                onMouseDown={(event) => event.preventDefault()}
                onPressedChange={() =>
                  editor.chain().focus().toggleBulletList().run()
                }
                className={cn(
                  editorState.isBulletList && "bg-muted text-foreground-muted",
                )}
              >
                <ListIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                type="button"
                size="sm"
                pressed={editorState.isOrderedList}
                onMouseDown={(event) => event.preventDefault()}
                onPressedChange={() =>
                  editor.chain().focus().toggleOrderedList().run()
                }
                className={cn(
                  editorState.isOrderedList && "bg-muted text-foreground-muted",
                )}
              >
                <ListOrdered />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Order List</TooltipContent>
          </Tooltip>
        </div>
        <div className="w-px h-7 bg-border mx-2 "></div>
        <div className="flex flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => editor.chain().focus().undo().run()}
                onMouseDown={(event) => event.preventDefault()}
                size="sm"
                variant={"ghost"}
                type="button"
                disabled={!editorState.canUndo}
              >
                <Undo />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => editor.chain().focus().redo().run()}
                onMouseDown={(event) => event.preventDefault()}
                size="sm"
                variant={"ghost"}
                type="button"
                disabled={!editorState.canRedo}
              >
                <Redo />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
        </div>
        {/* Separator **/}
        <div className="w-px h-6 bg-border mx-2"></div>
        <div className="flex flex-wrap gap-1">
          <ComposeAssistant
            content={JSON.stringify(editorState.currentContent)}
            onAccept={handleAcceptCompose}
          />
        </div>
      </TooltipProvider>
    </div>
  );
}
