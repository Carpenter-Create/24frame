import { flushSync } from "react-dom";

// /dashboard Top performing: Territories map is taller than Titles /
// Platforms lists. html uses scroll-behavior: smooth, so unmounting the
// map lets the browser ease the page to top. Instant scrollTo after
// flushSync is not enough on Mac — a later frame can still run the
// sitewide smooth rule. Force html scroll-behavior: auto around the
// swap, restore immediately, then again on two animation frames.
// Do not change the sitewide rule.
export const DASHBOARD_SCROLL_RESTORE_BEHAVIOR = "instant" as const;
export const DASHBOARD_SCROLL_SWAP_BEHAVIOR = "auto" as const;

function restoreWindowOffset(left: number, top: number): void {
  window.scrollTo({ left, top, behavior: DASHBOARD_SCROLL_RESTORE_BEHAVIOR });
}

function scheduleFollowUp(fn: () => void): void {
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => {
      fn();
    });
    return;
  }
  if (typeof window.setTimeout === "function") {
    window.setTimeout(fn, 0);
    return;
  }
  fn();
}

export function preserveWindowScroll(mutate: () => void): void {
  if (typeof window === "undefined") {
    mutate();
    return;
  }
  const left = window.scrollX;
  const top = window.scrollY;
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = DASHBOARD_SCROLL_SWAP_BEHAVIOR;

  const finish = () => {
    root.style.scrollBehavior = previousBehavior;
  };

  try {
    flushSync(mutate);
    restoreWindowOffset(left, top);
  } catch (error) {
    finish();
    throw error;
  }

  scheduleFollowUp(() => {
    restoreWindowOffset(left, top);
    scheduleFollowUp(() => {
      restoreWindowOffset(left, top);
      finish();
    });
  });
}
