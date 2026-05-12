"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { MessageItem } from "./message/MessageItem";
import { orpc } from "@/lib/orpc";
import { useParams } from "next/navigation";
import { useLayoutEffect, useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery({
      ...infiniteOptions,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    });

  useLayoutEffect(() => {
    if (!hasInitialScrolled && data?.pages.length) {
      const el = scrolledRef.current;

      if (el) {
        el.scrollTop = el.scrollHeight;
        setHasInitialScrolled(true);
        setIsAtBottom(true);
      }
    }
  }, [hasInitialScrolled, data?.pages.length]);

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

    el.scrollTop = el.scrollHeight;

    setNewMessages(false);
    setIsAtBottom(true);
  };

  return (
    <div className="relaltive h-full">
      <div
        className="h-full overflow-y-auto px-4 flex flex-col space-y-1"
        ref={scrolledRef}
        onScroll={handleScroll}
      >
        {items?.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={bottomRef}></div>
      </div>
      {newMessages && !isAtBottom ? (
        <Button
          type="button"
          className="absolute bottmo-4 right-4 rounded-full "
          onClick={scrollToBottom}
        >
          New Messages
        </Button>
      ) : null}
    </div>
  );
}
