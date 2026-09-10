import { useEffect, useRef, useState } from "react";
import usePartySocket from "partysocket/react";
import {
  PresenceMessage,
  PresenceMessageSchema,
  User,
} from "@/schemas/realtime";

interface usePresenceProps {
  room: string;
  currentUser: User | null;
}

export function usePresence({ room, currentUser }: usePresenceProps) {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const currentUserRef = useRef(currentUser);

  const socket = usePartySocket({
    host: "http://localhost:8787",
    room: room,
    party: "chat",
    onOpen() {
      console.log("connected to presence room: " + room);
      setIsConnected(true);
    },

    onMessage(event) {
      try {
        const message = JSON.parse(event.data);

        const result = PresenceMessageSchema.safeParse(message);

        if (result.success && result.data.type === "presence") {
          setOnlineUsers(result.data.payload.users);
        }
      } catch (error) {
        console.log("Failed to parse message " + error);
      }
    },

    onClose() {
      console.log("Diconnected from presence room " + room);
      setIsConnected(false);
    },

    onError(error) {
      console.log("Websocket error: " + error);
    },
  });

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    const user = currentUserRef.current;
    if (!isConnected || !user) return;

    const message: PresenceMessage = {
      type: "add-user",
      payload: user,
    };
    socket.send(JSON.stringify(message));
  }, [currentUser?.id, isConnected, socket]);

  return {
    onlineUsers,
    socket,
  };
}
