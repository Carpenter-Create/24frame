"use client";

import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import {
  socialNavActivePath,
  socialNavIgnorePendingClick,
  socialNavPendingSettled,
  type SocialNavClickLike,
} from "@/lib/social-nav-pending";

// Instant Social chrome: click paints the destination before the RSC page
// resolves. useLinkStatus covers the in-flight Link; onClick covers the
// same tick. A settled pathname drops the optimistic href without an effect.

export function useSocialNavPending() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const markPending = useCallback((href: string, event?: SocialNavClickLike) => {
    if (event && socialNavIgnorePendingClick(event)) return;
    setPendingHref(href);
  }, []);

  const livePending =
    pendingHref && socialNavPendingSettled(pathname, pendingHref) ? null : pendingHref;

  return {
    activePath: socialNavActivePath(pathname, livePending),
    markPending,
    pendingHref: livePending,
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
  if (pending) onPending(href);
  return null;
}
