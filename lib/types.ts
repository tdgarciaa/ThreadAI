import { Message } from "@/generated/prisma/client";
import { GroupReactionsSchemaType } from "@/schemas/message";

export type MessageListItem = Message & {
  replyCount: number;
  reactions: GroupReactionsSchemaType[];
};
