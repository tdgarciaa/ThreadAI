import arcjet, { shield, detectBot, slidingWindow } from "@/lib/arcjet";
import { base } from "../base";
import type { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";

const buildStandardAj = () =>
  arcjet.withRule(
    slidingWindow({
      mode: "LIVE",
      interval: "1m",
      max: 2,
    }),
  );

export const heavyWriteSecurityhMiddleweare = base
  .$context<{
    request: Request;
    user: KindeUser<Record<string, unknown>>;
  }>()
  .middleware(async ({ context, errors, next }) => {
    const decision = await buildStandardAj().protect(context.request, {
      userId: context.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw errors.RATE_LIMITED({
          message: "To many impactfull changes, please slow down",
        });
      }

      throw errors.FORBIDDEN({
        message: "Request blocked",
      });
    }

    return next();
  });
