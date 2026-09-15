import { inviteMemberSchema } from "@/schemas/members";
import { heavyWriteSecurityhMiddleweare } from "../middlewares/arcjet/heavy-write";
import { standardSecurityhMiddleweare } from "../middlewares/arcjet/standard";
import { requiredAuthMiddleeare } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorkspaceMiddleeare } from "../middlewares/workspace";
import z from "zod";
import {
  init,
  organization_user,
  Organizations,
  Users,
} from "@kinde/management-api-js";
import { getAvatar } from "@/lib/get-avatar";
import { readSecurityhMiddleweare } from "../middlewares/arcjet/read";

export const inviteMember = base
  .use(requiredAuthMiddleeare)
  .use(requiredWorkspaceMiddleeare)
  .use(standardSecurityhMiddleweare)
  .use(heavyWriteSecurityhMiddleweare)
  .route({
    method: "POST",
    path: "/workspace/members/invite",
    summary: "Invite member",
    tags: ["Members"],
  })
  .input(inviteMemberSchema)
  .output(z.void())
  .handler(async ({ input, context, errors }) => {
    try {
      init();
      await Users.createUser({
        requestBody: {
          organization_code: context.workspace.orgCode,
          profile: {
            given_name: input.name,
            picture: getAvatar(null, input.email),
          },
          identities: [
            {
              type: "email",
              details: {
                email: input.email,
              },
            },
          ],
        },
      });
    } catch {
      throw errors.INTERNAL_SERVER_ERROR();
    }
  });

export const listMembers = base
  .use(requiredAuthMiddleeare)
  .use(requiredWorkspaceMiddleeare)
  .use(standardSecurityhMiddleweare)
  .use(readSecurityhMiddleweare)
  .route({
    method: "GET",
    path: "/workspace/members",
    summary: "List all members",
    tags: ["Members"],
  })
  .input(z.void())
  .output(z.array(z.custom<organization_user>()))
  .handler(async ({ context, errors }) => {
    try {
      init();
      const data = await Organizations.getOrganizationUsers({
        orgCode: context.workspace.orgCode,
        sort: "name_asc",
      });
      if (!data.organization_users) throw errors.NOT_FOUND();
      if (process.env.NODE_ENV === "development") {
        for (const member of data.organization_users) {
          if (!member.id) continue;

          try {
            const roleData = await Organizations.getOrganizationUserRoles({
              orgCode: context.workspace.orgCode,
              userId: member.id,
            });
            console.log(
              "Detalles de roles de Kinde:",
              JSON.stringify({
                memberId: member.id,
                full_name: member.full_name,
                listedRoles: member.roles,
                roles: roleData.roles,
              }, null, 2),
            );
          } catch (error) {
            console.error("No se pudieron consultar los roles de Kinde:", member.id, error);
          }
        }
      }
      return data.organization_users;
    } catch {
      throw errors.INTERNAL_SERVER_ERROR();
    }
  });
