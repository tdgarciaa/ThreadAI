import { MessageListItem } from "@/lib/types";
import {
  ChannelEvent,
  ChannelEventSchema,
  RealtimeMessage,
} from "@/schemas/realtime";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { Channel } from "diagnostics_channel";
import usePartySocket from "partysocket/react";
import { createContext, ReactNode, useContext } from "react";
import { useMemo } from "react";

type ChannelRealtimeContextValue = {
  send: (event: ChannelEvent) => void;
};
interface ChannelRealtimeProviderProps {
  channelId: string;
  children: ReactNode;
}

type MessageListPage = {
  items: RealtimeMessage[];
  nextCursor?: string;
};

type InfiniteMessages = InfiniteData<MessageListPage>;
const ChannelRealtimeContext =
  createContext<ChannelRealtimeContextValue | null>(null);

export function ChannelRealtimeProvider({
  channelId,
  children,
}: ChannelRealtimeProviderProps) {
  const queryClient = useQueryClient();
  const socket = usePartySocket({
    host: "http://localhost:8787",
    room: `channel-${channelId}`,
    party: "chat",

    onMessage(e) {
      try {
        const parsed = JSON.parse(e.data);

        const result = ChannelEventSchema.safeParse(parsed);

        if (!result.success) {
          console.warn("Invalid channel connection ");
          return;
        }
        const event = result.data;
        if (event.type === "message:created") {
          const raw = event.payload.message;
          queryClient.setQueryData<InfiniteMessages>(
            ["message.list", channelId],
            (old) => {
              if (!old) {
                return {
                  pages: [{ items: [raw], nextCursor: undefined }],
                } as InfiniteMessages;
              }

              const first = old.pages[0];

              const updatedFirst: MessageListPage = {
                ...first,
                items: [raw, ...first.items],
              };
              return { ...old, pages: [updatedFirst, ...old.pages.slice(1)] };
            },
          );
          //Insert at top of fidrt page od infinite list for the channel
        }
        if (event.type === "message:updated") {
          const updated = event.payload.message;

          //Replace message in the infinite list by id

          queryClient.setQueryData<InfiniteMessages>(
            ["message.list", channelId],
            (old) => {
              if (!old) return old;

              const pages = old.pages.map((p) => ({
                ...p,
                items: p.items.map((m) =>
                  m.id === updated.id ? { ...m, ...updated } : m,
                ),
              }));

              return { ...old, pages };
            },
          );
          return;
        }
      } catch {
        console.log("algoi ha ido mal");
      }
    },
  });
  const value = useMemo<ChannelRealtimeContextValue>(() => {
    return {
      send: (event) => {
        socket.send(JSON.stringify(event));
      },
    };
  }, [socket]);
  return (
    <ChannelRealtimeContext value={value}>{children}</ChannelRealtimeContext>
  );
}

export function useChannelRealTime(): ChannelRealtimeContextValue {
  const ctx = useContext(ChannelRealtimeContext);

  if (!ctx) {
    throw new Error(
      "useChannel realtime  must be used within a channelRealtimeProvider",
    );
  }

  return ctx;
}
