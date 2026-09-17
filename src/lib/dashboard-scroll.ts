import { flushSync } from "react-dom";

// /dashboard Top performing: Territories map is taller than Titles /
// Platforms lists. html uses scroll-behavior: smooth, so unmounting the
// map lets the browser ease the page to top. Restore the pre-swap
// window offset with an instant scroll after the commit.
export const DASHBOARD_SCROLL_RESTORE_BEHAVIOR = "instant" as const;

export function preserveWindowScroll(mutate: () => void): void {
  if (typeof window === "undefined") {
    mutate();
    return;
  }
  const left = window.scrollX;
  const top = window.scrollY;
  flushSync(mutate);
  window.scrollTo({ left, top, behavior: DASHBOARD_SCROLL_RESTORE_BEHAVIOR });
}
