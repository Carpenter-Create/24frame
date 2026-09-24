"use client";

import { useEffect } from "react";

/** Newest sits at the bottom of the thread's own scroller. */
export function SocialDmThreadStick({ nonce }: { nonce: string }) {
  useEffect(() => {
    const column = document.querySelector<HTMLElement>("[data-social-dm-column]");
    if (!column) return;
    column.scrollTop = column.scrollHeight;
  }, [nonce]);
  return null;
}
