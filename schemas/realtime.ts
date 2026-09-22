import { z } from "zod";
import { groupReactionsSchema } from "./message";

export const UserSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  email: z.email().nullable(),
  picture: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const PresenceMessageSchema = z.union([
  z.object({
    type: z.literal("add-user"),
    payload: UserSchema,
  }),
  z.object({
    type: z.literal("remove-user"),
    payload: z.object({ id: z.string() }),
  }),
  z.object({
    type: z.literal("presence"),
    payload: z.object({ users: z.array(UserSchema) }),
  }),
]);

export type PresenceMessage = z.infer<typeof PresenceMessageSchema>;

//Minimal message shape for realtime events

export const RealtimeMessageSchema = z.object({
  id: z.string(),
  content: z.string().optional().nullable(),
  imageUrl: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  authorEmail: z.string().optional().nullable(),
  authorName: z.string().optional().nullable(),
  authorId: z.string().optional(),
  authorAvatar: z.string().nullable().optional(),
  channelId: z.string().nullable(),
  workspaceId: z.string().optional(),
  threadId: z.string().optional().nullable(),

  reactions: z.array(groupReactionsSchema).default([]).optional(),
  replyCount: z.number().default(0).optional(),
});

export type RealtimeMessage = z.infer<typeof RealtimeMessageSchema>;
// CHannel-level events

export const ChannelEventSchema = z.union([
  z.object({
    type: z.literal("message:created"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("message:updated"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("reaction:updated"),
    payload: z.object({
      messageId: z.string(),
      reactions: z.array(groupReactionsSchema),
    }),
  }),
  z.object({
    type: z.literal("message:replies:increment"),
    payload: z.object({ messageId: z.string(), delta: z.number() }),
  }),
]);
export type ChannelEvent = z.infer<typeof ChannelEventSchema>;

// Thread level events

export const ThreadEventSchema = z.union([
  z.object({
    type: z.literal("thread:reply:created"),
    payload: z.object({ reply: RealtimeMessageSchema }),
  }),

  z.object({
    type: z.literal("thread:reaction:updated"),
    payload: z.object({
      messageId: z.string(),
      reactions: z.array(groupReactionsSchema),
      threadId: z.string(),
    }),
  }),
]);

export type ThreadEvent = z.infer<typeof ThreadEventSchema>;
