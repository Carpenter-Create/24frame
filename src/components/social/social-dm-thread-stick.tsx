"use client";

import { useEffect } from "react";

/** Newest sits at the bottom of the thread scroller. */
export function SocialDmThreadStick({ nonce }: { nonce: string }) {
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>("[data-house-lead-scroll]");
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
      return;
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
  }, [nonce]);
  return null;
}
