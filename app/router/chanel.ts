import { ChannelNameSchema } from "@/schemas/channel";
import { heavyWriteSecurityhMiddleweare } from "../middlewares/arcjet/heavy-write";
import { standardSecurityhMiddleweare } from "../middlewares/arcjet/standard";
import { requiredAuthMiddleeare } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorkspaceMiddleeare } from "../middlewares/workspace";
import z from "zod";
import prisma from "@/lib/db";
import type { Channel } from "@/generated/prisma/client";
import { init, Organizations } from "@kinde/management-api-js";
import { KindeOrganization } from "@kinde-oss/kinde-auth-nextjs";
import type { organization_user } from "@kinde/management-api-js";

export const createChannel = base
  .use(requiredAuthMiddleeare)
  .use(requiredWorkspaceMiddleeare)
  .use(standardSecurityhMiddleweare)
  .use(heavyWriteSecurityhMiddleweare)
  .route({
    method: "POST",
    path: "/channels",
    summary: "Create a new Channel",
    tags: ["channels"],
  })
  .input(ChannelNameSchema)
  .output(z.custom<Channel>())
  .handler(async ({ input, context }) => {
    const channel = await prisma.channel.create({
      data: {
        name: input.name,
        workspaceId: context.workspace.orgCode,
        createdById: context.user.id,
      },
    });

    return channel;
  });

export const listChannels = base
  .use(requiredAuthMiddleeare)
  .use(requiredWorkspaceMiddleeare)
  .route({
    method: "GET",
    path: "/channels",
    tags: ["channels"],
  })
  .input(z.void())
  .output(
    z.object({
      channels: z.array(z.custom<Channel>()),
      currentWorkspace: z.custom<KindeOrganization<unknown>>(),
      members: z.array(z.custom<organization_user>()),
    }),
  )
  .handler(async ({ context }) => {
    const [channels, members] = await Promise.all([
      await prisma.channel.findMany({
        where: {
          workspaceId: context.workspace.orgCode,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      (async () => {
        init();

        const usersInOrg = await Organizations.getOrganizationUsers({
          orgCode: context.workspace.orgCode,
          sort: "name_asc",
        });

        return usersInOrg.organization_users ?? [];
      })(),
    ]);
    return {
      channels,
      members,
      currentWorkspace: context.workspace,
    };
  });
