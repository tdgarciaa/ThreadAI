import arcjet, { shield, detectBot } from "@/lib/arcjet";
import { base } from "../base";
import type { KindeUser } from "@kinde-oss/kinde-auth-nextjs";

const buildStandardAj = () =>
  arcjet
    .withRule(
      shield({
        mode: "LIVE",
      }),
    )
    .withRule(
      detectBot({
        mode: "LIVE",
        allow: [
          "CATEGORY:SEARCH_ENGINE",
          "CATEGORY:PREVIEW",
          "CATEGORY:MONITOR",
        ],
      }),
    );

export const standardSecurityhMiddleweare = base
  .$context<{
    request: Request;
    user: KindeUser<Record<string, unknown>>;
  }>()
  .middleware(async ({ context, errors, next }) => {
    const decision = await buildStandardAj().protect(context.request, {
      userId: context.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isBot()) {
        throw errors.FORBIDDEN({
          message: "Request blocked by bot protection",
        });
      }

      if (decision.reason.isShield()) {
        throw errors.FORBIDDEN({
          message: "Request blocked by security policy (WAF)",
        });
      }

      throw errors.FORBIDDEN({
        message: "Request blocked",
      });
    }

    return next();
  });
