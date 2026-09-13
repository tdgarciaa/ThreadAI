import { ChannelEventSchema } from "@/schemas/realtime";
import { useQueryClient } from "@tanstack/react-query";
import usePartySocket from "partysocket/react";
import { createContext, ReactNode } from "react";

interface ChannelRealtimeProviderProps {
  channelId: string;
  children: ReactNode;
}

const ChannelRealtimeContext = createContext(null);

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
          queryClient.setQueryData(["message.list", channelId], (old) => {});
          //Insert at top of fidrt page od infinite list for the channel
        }
      } catch {}
    },
  });
}
