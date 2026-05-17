"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { MessageItem } from "./message/MessageItem";
import { orpc } from "@/lib/orpc";
import { useParams } from "next/navigation";
import { useLayoutEffect, useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/general/EmptyState";
import { ChevronDown, Loader2 } from "lucide-react";
import { is } from "zod/v4/locales";

export function MessageList() {
  const { channelId } = useParams<{ channelId: string }>();
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  const scrolledRef = useRef<HTMLDivElement | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [newMessages, setNewMessages] = useState(false);
  const lastItemIdRef = useRef<string | undefined>(undefined);

  const pendingScrollHeightRef = useRef<number | null>(null);
  const pendingScrollTopRef = useRef<number | null>(null);
  const infiniteOptions = orpc.message.list.infiniteOptions({
    input: (pageParam: string | undefined) => ({
      channelId: channelId,
      cursor: pageParam,
      limit: 30,
    }),

    queryKey: ["message.list", channelId],
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => ({
      pages: [...data.pages]
        .map((p) => ({
          ...p,
          items: [...p.items].reverse(),
        }))
        .reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    error,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...infiniteOptions,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  //Scroll to the bottom when messages first load
  useLayoutEffect(() => {
    if (!hasInitialScrolled && data?.pages.length) {
      const el = scrolledRef.current;

      if (el) {
        const scrollToBottom = () => {
          bottomRef.current?.scrollIntoView({ block: "end" });
        };

        scrollToBottom();
        requestAnimationFrame(scrollToBottom);
        setHasInitialScrolled(true);
        setIsAtBottom(true);
      }
    }
  }, [hasInitialScrolled, data?.pages.length]);

  //Keep view pinned to bottom on late content growth

  useEffect(() => {
    const el = scrolledRef.current;
    if (!el) return;

    const scrollToBottomIfNeeded = () => {
      if (isAtBottom && hasInitialScrolled) {
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
  }, [isAtBottom, hasInitialScrolled]);

  useLayoutEffect(() => {
    const el = scrolledRef.current;
    const previousScrollHeight = pendingScrollHeightRef.current;
    const previousScrollTop = pendingScrollTopRef.current;

    if (!el || previousScrollHeight === null || previousScrollTop === null) {
      return;
    }

    el.scrollTop = el.scrollHeight - previousScrollHeight + previousScrollTop;
    pendingScrollHeightRef.current = null;
    pendingScrollTopRef.current = null;
  }, [data?.pages.length]);

  const isNearBottom = (el: HTMLDivElement) =>
    el.scrollHeight - el.scrollTop - el.clientHeight <= 80;

  const handleScroll = () => {
    const el = scrolledRef.current;

    if (!el) return;

    if (
      el.scrollTop <= 80 &&
      hasNextPage &&
      !isFetching &&
      pendingScrollHeightRef.current === null
    ) {
      pendingScrollHeightRef.current = el.scrollHeight;
      pendingScrollTopRef.current = el.scrollTop;
      fetchNextPage().catch(() => {
        pendingScrollHeightRef.current = null;
        pendingScrollTopRef.current = null;
      });
    }
    setIsAtBottom(isNearBottom(el));
  };

  const items = useMemo(() => {
    return data?.pages.flatMap((p) => p.items) ?? [];
  }, [data]);

  const isEmpty = !isLoading && !error && items.length === 0;

  useEffect(() => {
    if (!items.length) return;

    const lastId = items[items.length - 1].id;

    const prevLastId = lastItemIdRef.current;

    const el = scrolledRef.current;

    if (prevLastId && lastId != prevLastId) {
      if (el && isNearBottom(el)) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
        setNewMessages(false);
        setIsAtBottom(true);
      } else {
        setNewMessages(true);
      }
    }
    lastItemIdRef.current = lastId;
  }, [items]);

  const scrollToBottom = () => {
    const el = scrolledRef.current;

    if (!el) return;

    bottomRef.current?.scrollIntoView({ block: "end" });

    setNewMessages(false);
    setIsAtBottom(true);
  };

  return (
    <div className="relative h-full">
      <div
        className="h-full overflow-y-auto px-4 flex flex-col space-y-1"
        ref={scrolledRef}
        onScroll={handleScroll}
      >
        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center w-full">
            <EmptyState
              title="No messages yet"
              description="Start the conversation by sending the first message"
              buttonText="Send a message"
              href=""
            />
          </div>
        ) : (
          items?.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        )}
        <div ref={bottomRef}></div>
      </div>

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

      {/* {isFetchingNextPage && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex items-center justify-center py-2 ">
          <div className="flex items-center gap-2 rounded-md bg-gradient-to-b-from-white/80 to-transparent dark:from-neutral-900/80 backdrop-blur px-3 py-1">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span>Loading previous messages...</span>
          </div>
        </div>
      )} */}

      {newMessages && !isAtBottom ? (
        <Button
          type="button"
          className="absolute bottom-4 right-4 rounded-full "
          onClick={scrollToBottom}
        >
          New Messages
        </Button>
      ) : null}
    </div>
  );
}
