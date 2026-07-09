import {
  PopoverTrigger,
  Popover,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { eventIteratorToStream } from "@orpc/client";
import { client } from "@/lib/orpc";
import { useRef } from "react";
import { MessageResponse } from "@/components/ai-elements/message";
import { Skeleton } from "../ui/skeleton";

interface ComposeAssistantProps {
  content: string;
  onAccept?: (markdown: string) => void;
}

export function ComposeAssistant({ content, onAccept }: ComposeAssistantProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const {
    messages,
    status,
    error,
    sendMessage,
    setMessages,
    stop,
    clearError,
  } = useChat({
    id: `compose-assistant`,
    transport: {
      async sendMessages(options) {
        return eventIteratorToStream(
          await client.ai.compose.generate(
            { content: contentRef.current },
            { signal: options.abortSignal },
          ),
        );
      },
      reconnectToStream() {
        throw new Error("Unsupported");
      },
    },
  });

  function handleOpenchange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      const hasAssistantMessage = messages.some((m) => m.role === "assistant");
      if (status !== "ready" || hasAssistantMessage) {
        return;
      }
      sendMessage({ text: "Rewrite" });
    } else {
      stop();
      clearError();
      setMessages([]);
    }
  }

  const lastAssistent = messages.findLast((m) => m.role === "assistant");

  const composeText =
    lastAssistent?.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n\n") ?? "";

  return (
    <Popover open={open} onOpenChange={handleOpenchange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="relative overflow-hidden bg-gradient-to-t from-violet-600 to-fuchsia-600 text-white shadow-md hover:shadow:lg focus-visible:ring-2 focus-visible:ring-ring cursor-pointer
          "
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            <span className="text-xs size-md">Compose</span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[25rem] p-0 ">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span
              className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-1.5
            px-4 gap-1.5"
            >
              <Sparkles className="size-3.5 text-white p-s" />
              <span className="text-sm font-medium">
                Compose Assistant (Preview)
              </span>
            </span>
          </div>
          {status === "streaming" && (
            <Button
              onClick={() => {
                stop();
              }}
              type="button"
              variant="outline"
              size="sm"
            >
              Stop
            </Button>
          )}
        </div>
        <div className="px-4 py-3 max-h-80 overflow-y-auto">
          {error ? (
            <div>
              <p className="text-red-500">{error.message}</p>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  clearError();
                  setMessages([]);
                  sendMessage({ text: "Rewrite" });
                }}
              >
                Try Again
              </Button>
            </div>
          ) : composeText ? (
            <MessageResponse parseIncompleteMarkdown={status !== "ready"}>
              {composeText}
            </MessageResponse>
          ) : status === "submitted" || status === "streaming" ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Click compose to generate
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-3 py-2 bg-muted/30">
          <Button
            type="submit"
            size="sm"
            variant="outline"
            onClick={() => {
              stop();
              clearError();
              setMessages([]);
              setOpen(false);
            }}
          >
            Decline
          </Button>
          <Button
            onClick={() => {
              if (!composeText) return;
              onAccept?.(composeText);
              stop();
              clearError();
              setMessages([]);
              setOpen(false);
            }}
            disabled={!composeText}
            type="submit"
            size="sm"
          >
            Accept
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
