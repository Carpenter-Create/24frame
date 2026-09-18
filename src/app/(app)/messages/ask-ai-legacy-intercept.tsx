"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  legacyAskAiFallbackPath,
  legacyAskAiInterceptHref,
  readAskAiReturnPath,
} from "@/lib/ask-ai-overlay";
import { parseWorkspaceCookie } from "@/lib/workspace";

function workspaceCookieMode() {
  if (typeof document === "undefined") return "aggregation" as const;
  const match = document.cookie.match(/(?:^|; )24frame_workspace=([^;]*)/);
  return parseWorkspaceCookie(match?.[1] ? decodeURIComponent(match[1]) : null);
}

// Leftover /messages bookmarks open the overlay on the prior workspace
// path. Never a full-page AI destination.
export function AskAiLegacyIntercept({ threadId }: { threadId?: string | null }) {
  const router = useRouter();

  useEffect(() => {
    const fallback = legacyAskAiFallbackPath(workspaceCookieMode());
    router.replace(
      legacyAskAiInterceptHref({
        threadId,
        returnPath: readAskAiReturnPath(fallback),
        workspace: workspaceCookieMode(),
      }),
    );
  }, [router, threadId]);

  return <div data-ask-ai-legacy-intercept="" hidden />;
}
