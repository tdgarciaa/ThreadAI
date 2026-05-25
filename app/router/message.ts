import { standardSecurityhMiddleweare } from "../middlewares/arcjet/standard";
import { writeSecurityhMiddleweare } from "../middlewares/arcjet/write";
import { requiredAuthMiddleeare } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorkspaceMiddleeare } from "../middlewares/workspace";
import z, { boolean } from "zod";
import prisma from "@/lib/db";
import { createMessageSchema, updateMessageSchema } from "@/schemas/message";
import { getAvatar } from "@/lib/get-avatar";
import { Message } from "@/generated/prisma/client";
import { readSecurityhMiddleweare } from "../middlewares/arcjet/read";

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
      items: z.array(z.custom<Message>()),
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
    });

    const nextCursor =
      messages.length === limit ? messages[messages.length - 1].id : undefined;

    return {
      items: messages,
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
      parent: z.custom<Message>(),
      messages: z.array(z.custom<Message>()),
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
    });

    if (!parentRow) {
      throw errors.NOT_FOUND;
    }

    const replies = await prisma.message.findMany({
      where: {
        threadId: input.messageId,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    const parent = {
      ...parentRow,
    };

    const messages = replies.map((r) => ({
      ...r,
    }));

    return {
      parent,
      messages,
    };
  });
