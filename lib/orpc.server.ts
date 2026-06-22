import "server-only";
import { router } from "@/app/router";

import { headers } from "next/headers";
import { createRouterClient } from "@orpc/server";

globalThis.$client = createRouterClient(router, {
  /**
   * Provide initial context if needed.
   *
   * Because this client instance is shared across all requests,
   * only include context that's safe to reuse globally.
   * For per-request context, use middleware context or pass a function as the initial context.
   */
  context: async () => {
    const requestHeaders = await headers();
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    const host = requestHeaders.get("host") ?? "localhost";

    return {
      request: new Request(`${protocol}://${host}`, {
        headers: requestHeaders,
      }),
    };
  },
});
