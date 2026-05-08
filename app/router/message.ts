import { standardSecurityhMiddleweare } from "../middlewares/arcjet/standard";
import { writeSecurityhMiddleweare } from "../middlewares/arcjet/write";
import { requiredAuthMiddleeare } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorkspaceMiddleeare } from "../middlewares/workspace";
import z from "zod";
import prisma from "@/lib/db";
import { createMessageSchema } from "@/schemas/message";
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
        imageUrl: input.imageUrl ?? "none",
        workspaceId: context.workspace.orgCode,
        createdById: context.user.id,
        channelId: input.channelId,
        authorId: context.user.id,
        authorEmail,
        authorName,
        authorAvatar: getAvatar(authorPicture, authorEmail),
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
