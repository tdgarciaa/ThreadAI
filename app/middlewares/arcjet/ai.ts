import aj, {
  detectBot,
  sensitiveInfo,
  shield,
  slidingWindow,
} from "@/lib/arcjet";
import { base } from "../base";
import type { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";

const buildAiAj = () => {
  return aj
    .withRule(
      shield({
        mode: "LIVE",
      }),
    )
    .withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m",
        max: 3,
      }),
    )
    .withRule(
      detectBot({
        mode: "LIVE",
        allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
      }),
    )
    .withRule(
      sensitiveInfo({
        mode: "LIVE",
        deny: ["PHONE_NUMBER", "CREDIT_CARD_NUMBER"],
      }),
    );
};

export const aiSecurityMiddleware = base
  .$context<{
    request: Request;
    user: KindeUser<Record<string, unknown>>;
  }>()
  .middleware(async ({ context, errors, next }) => {
    const decision = await buildAiAj().protect(context.request, {
      userId: context.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isSensitiveInfo()) {
        throw errors.RATE_LIMITED({
          message:
            "Sensitive information detected. Please remove pii (Credit card, phone number)",
        });
      }
      if (decision.reason.isRateLimit()) {
        throw errors.RATE_LIMITED({
          message: "To many request. Please try again later",
        });
      }
      if (decision.reason.isBot()) {
        throw errors.FORBIDDEN({
          message: "Automated traffic blocked",
        });
      }
      if (decision.reason.isShield()) {
        throw errors.FORBIDDEN({
          message: "Request blocked by security policy (waf)",
        });
      }
      throw errors.FORBIDDEN({ message: "Request blocked" });
    }

    return next();
  });
