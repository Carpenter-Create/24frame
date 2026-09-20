"use client";

import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import {
  houseNavActivePath,
  houseNavIgnorePendingClick,
  houseNavPendingSettled,
  type HouseNavClickLike,
} from "@/lib/house-nav-pending";

// Instant chrome: click lights the dest / workspace before the RSC
// page resolves. useLinkStatus covers the in-flight Link; onClick
// covers the same tick. A settled pathname drops the optimistic href.

export function useHouseNavPending() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const markPending = useCallback((href: string, event?: HouseNavClickLike) => {
    if (event && houseNavIgnorePendingClick(event)) return;
    setPendingHref(href);
  }, []);

  const livePending =
    pendingHref && houseNavPendingSettled(pathname, pendingHref) ? null : pendingHref;

  return {
    activePath: houseNavActivePath(pathname, livePending),
    markPending,
    pendingHref: livePending,
  };
}

export function HouseNavPendingProbe({
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
