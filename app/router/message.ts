import { standardSecurityhMiddleweare } from "../middlewares/arcjet/standard";
import { writeSecurityhMiddleweare } from "../middlewares/arcjet/write";
import { requiredAuthMiddleeare } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorkspaceMiddleeare } from "../middlewares/workspace";
import z from "zod";
import prisma from "@/lib/db";
import {
  createMessageSchema,
  updateMessageSchema,
  toggleReactionSchema,
  groupReactionsSchema,
  GroupReactionsSchemaType,
} from "@/schemas/message";
import { getAvatar } from "@/lib/get-avatar";
import { Message } from "@/generated/prisma/client";
import { readSecurityhMiddleweare } from "../middlewares/arcjet/read";
import { MessageListItem } from "@/lib/types";

// Groups individual reactions by counting
function groupReactions(
  reactions: { emoji: string; userId: string }[],
  userId: string,
): GroupReactionsSchemaType[] {
  const reactionMap = new Map<
    string,
    { count: number; reactedByMe: boolean }
  >();

  for (const reaction of reactions) {
    const existing = reactionMap.get(reaction.emoji);

    if (existing) {
      existing.count++;
      if (reaction.userId === userId) {
        existing.reactedByMe = true;
      }
    } else {
      reactionMap.set(reaction.emoji, {
        count: 1,
        reactedByMe: reaction.userId === userId,
      });
    }
  }
  return Array.from(
    reactionMap.entries().map(([emoji, data]) => {
      return {
        emoji,
        count: data.count,
        reactedByMe: data.reactedByMe,
      };
    }),
  );
}

export const createMessage = base
  .use(requiredAuthMiddleeare)
  .use(requiredWorkspaceMiddleeare)
  .use(standardSecurityhMiddleweare)
  .use(writeSecurityhMiddleweare)
  .route({
    method: "POST",
    path: "/messages",
    summary: "Create a message",
    tags: ["Messages"],
  })
  .input(createMessageSchema)
  .output(z.custom<Message>())
  .handler(async ({ context, errors, input }) => {
    const channel = await prisma.channel.findFirst({
      where: {
        id: input.channelId,
        workspaceId: context.workspace.orgCode,
      },
    });
    if (!channel) {
      throw errors.FORBIDDEN();
    }

    if (input.threadId) {
      const parentMessage = await prisma.message.findFirst({
        where: {
          id: input.threadId,
          channel: {
            workspaceId: context.workspace.orgCode,
          },
        },
      });

      if (
        !parentMessage ||
        parentMessage.channelId !== input.channelId ||
        parentMessage.threadId !== null
      ) {
        throw errors.BAD_REQUEST;
      }
    }

    const authorEmail = context.user.email;
    const authorName =
      typeof context.user.given_name === "string"
        ? context.user.given_name
        : "John Doe";
    const authorPicture =
      typeof context.user.picture === "string" ? context.user.picture : null;

    if (!authorEmail) {
      throw errors.UNAUTHORIZED();
    }

    const created = await prisma.message.create({
      data: {
        content: input.content,
        imageUrl: input.imageUrl,
        workspaceId: context.workspace.orgCode,
        createdById: context.user.id,
        channelId: input.channelId,
        authorId: context.user.id,
        authorEmail,
        authorName,
        authorAvatar: getAvatar(authorPicture, authorEmail),
        threadId: input.threadId ?? null,
      },
    });
    return {
      ...created,
    };
  });

export const listMessages = base
  .use(requiredAuthMiddleeare)
  .use(requiredWorkspaceMiddleeare)
  .use(standardSecurityhMiddleweare)
  .use(readSecurityhMiddleweare)
  .route({
    method: "GET",
    path: "/messages",
    summary: "list all messages",
    tags: ["Messages"],
  })
  .input(
    z.object({
      channelId: z.string(),
      limit: z.number().min(1).max(100).optional(),
      cursor: z.string().optional(),
    }),
  )
  .output(
    z.object({
      items: z.array(z.custom<MessageListItem>()),
      nextCursor: z.string().optional(),
    }),
  )
  .handler(async ({ context, input, errors }) => {
    const channel = await prisma.channel.findFirst({
      where: {
        id: input.channelId,
        workspaceId: context.workspace.orgCode,
      },
    });

    if (!channel) {
      throw errors.FORBIDDEN();
    }

    const limit = input.limit ?? 30;
    const messages = await prisma.message.findMany({
      where: {
        channelId: input.channelId,
        threadId: null,
      },
      ...(input.cursor
        ? {
            cursor: { id: input.cursor },
            skip: 1,
          }
        : {}),
      take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        _count: { select: { replies: true } },
        MessageReaction: {
          select: {
            emoji: true,
            userId: true,
          },
        },
      },
    });

    const items: MessageListItem[] = messages.map((m) => ({
      id: m.id,
      content: m.content,
      imageUrl: m.imageUrl,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      createdById: m.createdById,
      authorAvatar: m.authorAvatar,
      authorEmail: m.authorEmail,
      authorId: m.authorId,
      authorName: m.authorName,
      channelId: m.channelId,
      threadId: m.threadId,
      replyCount: m._count.replies,
      workspaceId: m.workspaceId,
      reactions: groupReactions(
        m.MessageReaction.map((r) => ({
          emoji: r.emoji,
          userId: r.userId,
        })),
        context.user.id,
      ),
    }));
    const nextCursor =
      messages.length === limit ? messages[messages.length - 1].id : undefined;

    return {
      items: items,
      nextCursor,
    };
  });

export const updateMessage = base
  .use(requiredAuthMiddleeare)
  .use(requiredWorkspaceMiddleeare)
  .use(standardSecurityhMiddleweare)
  .use(writeSecurityhMiddleweare)
  .route({
    method: "PUT",
    path: "/messages/:messageId",
    summary: "Update",
    tags: ["Messages"],
  })
  .input(updateMessageSchema)
  .output(
    z.object({
      message: z.custom<Message>(),
      canEdit: z.boolean(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const message = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: {
          workspaceId: context.workspace.orgCode,
        },
      },
      select: {
        id: true,
        authorId: true,
      },
    });
    if (!message) {
      throw errors.NOT_FOUND();
    }

    if (message.authorId !== context.user.id) {
      throw errors.FORBIDDEN();
    }

    const updated = await prisma.message.update({
      where: {
        id: input.messageId,
      },
      data: {
        content: input.content,
      },
    });
    return {
      message: updated,
      canEdit: updated.authorId === context.user.id,
    };
  });

export const listThreadReply = base
  .use(requiredAuthMiddleeare)
  .use(requiredWorkspaceMiddleeare)
  .use(standardSecurityhMiddleweare)
  .use(readSecurityhMiddleweare)
  .route({
    method: "GET",
    path: "/messages/:messageId/thread",
    summary: "List replies in thread",
    tags: ["Messages"],
  })
  .input(
    z.object({
      messageId: z.string(),
    }),
  )
  .output(
    z.object({
      parent: z.custom<MessageListItem>(),
      messages: z.array(z.custom<MessageListItem>()),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const parentRow = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: {
          workspaceId: context.workspace.orgCode,
        },
      },
      include: {
        _count: {
          select: {
            replies: true,
          },
        },
        MessageReaction: {
          select: {
            emoji: true,
            userId: true,
          },
        },
      },
    });

    if (!parentRow) {
      throw errors.NOT_FOUND;
    }

    const messagesQuery = await prisma.message.findMany({
      where: {
        threadId: input.messageId,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: {
        _count: {
          select: {
            replies: true,
          },
        },
        MessageReaction: {
          select: {
            emoji: true,
            userId: true,
          },
        },
      },
    });

    const parent: MessageListItem = {
      id: parentRow.id,
      content: parentRow.content,
      imageUrl: parentRow.imageUrl,
      authorAvatar: parentRow.authorAvatar,
      authorEmail: parentRow.authorEmail,
      authorId: parentRow.authorId,
      authorName: parentRow.authorName,
      channelId: parentRow.channelId,
      createdAt: parentRow.createdAt,
      workspaceId: parentRow.workspaceId,
      createdById: parentRow.createdById,
      updatedAt: parentRow.updatedAt,
      threadId: parentRow.threadId,
      replyCount: parentRow._count.replies,

      reactions: groupReactions(
        parentRow.MessageReaction.map((r) => ({
          emoji: r.emoji,
          userId: r.userId,
        })),
        context.user.id,
      ),
    };

    const messages: MessageListItem[] = messagesQuery.map((m) => ({
      id: m.id,
      content: m.content,
      imageUrl: m.imageUrl,
      authorAvatar: m.authorAvatar,
      authorEmail: m.authorEmail,
      authorId: m.authorId,
      authorName: m.authorName,
      channelId: m.channelId,
      createdAt: m.createdAt,
      workspaceId: m.workspaceId,
      createdById: m.createdById,
      updatedAt: m.updatedAt,
      threadId: m.threadId,
      replyCount: m._count.replies,
      reactions: groupReactions(
        m.MessageReaction.map((r) => ({
          emoji: r.emoji,
          userId: r.userId,
        })),
        context.user.id,
      ),
    }));

    return {
      parent,
      messages,
    };
  });

export const toggleReaction = base
  .use(requiredAuthMiddleeare)
  .use(requiredWorkspaceMiddleeare)
  .use(standardSecurityhMiddleweare)
  .use(writeSecurityhMiddleweare)
  .route({
    method: "POST",
    path: "/messages/:messageId/reactions",
    summary: "Toggle a reaction",
    tags: ["Messages"],
  })

  .input(toggleReactionSchema)
  .output(
    z.object({
      messageId: z.string(),
      reactions: z.array(groupReactionsSchema),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const message = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: {
          workspaceId: context.workspace.orgCode,
        },
      },
      select: {
        id: true,
      },
    });
    if (!message) {
      throw errors.NOT_FOUND();
    }

    const userEmail = context.user.email;

    if (!userEmail) {
      throw errors.UNAUTHORIZED();
    }

    const inserted = await prisma.messageReaction.createMany({
      data: [
        {
          emoji: input.emoji,
          messageId: input.messageId,
          userId: context.user.id,
          userName: context.user.given_name ?? "John Doe",
          userAvatar: getAvatar(context.user.picture, userEmail),
          userEmail,
        },
      ],
      // skips: same user , same message, same reaction. Returns number
      skipDuplicates: true,
    });
    if (inserted.count === 0) {
      await prisma.messageReaction.deleteMany({
        where: {
          messageId: input.messageId,
          userId: context.user.id,
          emoji: input.emoji,
        },
      });
    }
    const updated = await prisma.message.findUnique({
      where: {
        id: input.messageId,
      },
      include: {
        MessageReaction: {
          select: {
            emoji: true,
            userId: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!updated) {
      throw errors.NOT_FOUND();
    }

    return {
      messageId: updated.id,
      reactions: groupReactions(
        (updated.MessageReaction ?? []).map((r) => ({
          emoji: r.emoji,
          userId: r.userId,
        })),
        context.user.id,
      ),
    };
  });
