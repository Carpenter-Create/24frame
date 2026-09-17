// Keep Top performing pill switches from jumping the viewport when the
// Territories map unmounts and the module height collapses.

export type DashboardWindowScroll = { x: number; y: number };

export function readWindowScroll(): DashboardWindowScroll | null {
  if (typeof window === "undefined") return null;
  return { x: window.scrollX, y: window.scrollY };
}

export function restoreWindowScroll(pos: DashboardWindowScroll | null): void {
  if (!pos || typeof window === "undefined") return;
  window.scrollTo(pos.x, pos.y);
}

export function afterWindowPaint(fn: () => void): void {
  if (typeof requestAnimationFrame !== "function") {
    fn();
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

export function restoreWindowScrollAfterPaint(pos: DashboardWindowScroll | null): void {
  restoreWindowScroll(pos);
  afterWindowPaint(() => restoreWindowScroll(pos));
}
