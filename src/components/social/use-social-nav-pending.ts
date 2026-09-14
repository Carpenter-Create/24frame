"use client";

import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  socialNavActivePath,
  socialNavIgnorePendingClick,
  socialNavPendingSettled,
  type SocialNavClickLike,
} from "@/lib/social-nav-pending";

// Instant Social chrome: click paints the destination before the RSC page
// resolves. useLinkStatus covers the in-flight Link; onClick covers the
// same tick. Pathname settlement clears the optimistic href.

export function useSocialNavPending() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (pendingHref && socialNavPendingSettled(pathname, pendingHref)) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  const markPending = useCallback((href: string, event?: SocialNavClickLike) => {
    if (event && socialNavIgnorePendingClick(event)) return;
    setPendingHref(href);
  }, []);

  return {
    activePath: socialNavActivePath(pathname, pendingHref),
    markPending,
    pendingHref,
  };
}

export function SocialNavPendingProbe({
  href,
  onPending,
}: {
  href: string;
  onPending: (href: string) => void;
}) {
  const { pending } = useLinkStatus();

  useEffect(() => {
    if (pending) onPending(href);
  }, [href, onPending, pending]);

  return null;
}
