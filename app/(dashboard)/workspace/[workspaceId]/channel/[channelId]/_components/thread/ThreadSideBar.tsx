import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ThreadReply } from "./ThreadReply";
import { ThreadReplyForm } from "./ThreadReplyForm";
import { useThread } from "@/providers/ThreadProviders";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { SaveContent } from "@/components/rich-text-editor/SaveContent";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { ThreadSidebarSkeleton } from "./ThreadSideBarSkeleton";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface ThreadSideBarProps {
  user: KindeUser<Record<string, unknown>>;
}
export function ThreadSideBar({ user }: ThreadSideBarProps) {
  const { selectedThreadId, closeThread } = useThread();

  //Scroll to bottom logic
  const scrolledRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const lasteMessageCountRef = useRef(0);

  const { data, isLoading } = useQuery(
    orpc.message.thread.list.queryOptions({
      input: {
        messageId: selectedThreadId!,
      },
      //Solo hace fecth en caso de que selectedThred != false
      enabled: Boolean(selectedThreadId),
    }),
  );

  const messgeCount = data?.messages.length ?? 0;

  const isNearBottom = (el: HTMLDivElement) =>
    el.scrollHeight - el.scrollTop - el.clientHeight <= 80;

  const handleScroll = () => {
    const el = scrolledRef.current;

    if (!el) return;

    setIsAtBottom(isNearBottom(el));
  };

  useEffect(() => {
    if (messgeCount === 0) return;

    const previousMessageCount = lasteMessageCountRef.current;
    const el = scrolledRef.current;

    if (previousMessageCount > 0 && messgeCount !== previousMessageCount) {
      if (el && isNearBottom(el)) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({
            block: "end",
            behavior: "smooth",
          });
        });
        setIsAtBottom(true);
      }
    }

    lasteMessageCountRef.current = messgeCount;
  }, [messgeCount]);

  useEffect(() => {
    const el = scrolledRef.current;
    if (!el) return;

    const scrollToBottomIfNeeded = () => {
      if (isAtBottom) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ block: "end" });
        });
      }
    };

    const onImageUpload = (e: Event) => {
      if (e.target instanceof HTMLImageElement) {
        scrollToBottomIfNeeded();
      }
    };

    el.addEventListener("load", onImageUpload, true);

    //Se llama cada vez que una imagen escala de 0 a n pixeles
    const resizeObserver = new ResizeObserver(() => {
      scrollToBottomIfNeeded();
    });
    resizeObserver.observe(el);

    //Watches from dom changes
    const mutationObserver = new MutationObserver(() => {
      scrollToBottomIfNeeded();
    });

    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener("load", onImageUpload, true);
      mutationObserver.disconnect();
    };
  }, [isAtBottom]);

  const scrollToBottom = () => {
    const el = scrolledRef.current;

    if (!el) return;

    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });

    setIsAtBottom(true);
  };

  if (isLoading) {
    return <ThreadSidebarSkeleton />;
  }
  return (
    <div className="w-120 border-l flex flex-col h-full">
      {/** Header */}
      <div className="border-b h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4" />
          <span>Thread</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={"outline"} size="icon" onClick={() => closeThread()}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
      {/** Main */}
      <div className="flex-1 overflow-y-auto relative">
        <div
          className="p-4 border-b bg-muted/20"
          ref={scrolledRef}
          onScroll={handleScroll}
        >
          {data && (
            <>
              <div className="flex space-x-3">
                <Image
                  src={data.parent.authorAvatar}
                  alt="Author image"
                  width={32}
                  height={32}
                  className="size-8 rounded-full"
                />
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {data.parent.authorName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-Us", {
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                        month: "short",
                        day: "numeric",
                      }).format(data.parent.createdAt)}
                    </span>
                  </div>
                  <SaveContent
                    className="text-sm wrap-break-word prose dark:prose-invert max-w-none"
                    content={data.parent.content}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        {/*  Scroll to bottom*/}
        {!isAtBottom && (
          <Button
            type="button"
            size="sm"
            className="absolute bottom-4 right-5 z-20 size-10 rounded-full hover:shadow-xñ transition-all duration-200"
            onClick={scrollToBottom}
          >
            <ChevronDown className="size-4" />
          </Button>
        )}
        {/**Thread replies */}
        <div className="p-2">
          <p className="text-xs text-muted-foreground mb-3 px-2">
            {data?.messages.length} replies
          </p>
          <div className="space-y-1">
            {data?.messages.map((reply) => (
              <ThreadReply
                key={reply.id}
                message={reply}
                selectedThreadId={selectedThreadId!}
              />
            ))}
          </div>
        </div>
        <div className="" ref={bottomRef}></div>
      </div>

      {/** Thread reply form */}
      <div className="border-t p-4">
        <ThreadReplyForm user={user} threadId={selectedThreadId!} />
      </div>
    </div>
  );
}
