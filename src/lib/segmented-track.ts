// House segmented-track behavior. Tokens stay in house-shell.
// The thumb slides by transitioning left + width. Route hops that
// remount the track (workspace Social fork, period query commits)
// would otherwise snap. A module cache stores the last painted box
// so the next mount can paint that box, then slide to the new item.

export type SegmentedThumbBox = {
  left: number;
  width: number;
};

export const SEGMENTED_TRACK_PERSIST = {
  workspace: "workspace-pills",
  period: "house-period-presets",
  activityStatus: "activity-status",
  activityPeriod: "activity-period",
  reportsPeriod: "reports-period",
  dashboardRanked: "dashboard-top-pills",
  reportsRanked: "reports-top-pills",
} as const;

const thumbCache = new Map<string, SegmentedThumbBox>();

export function readSegmentedThumbCache(
  persistKey: string,
): SegmentedThumbBox | undefined {
  return thumbCache.get(persistKey);
}

export function writeSegmentedThumbCache(
  persistKey: string,
  box: SegmentedThumbBox,
): void {
  if (!isUsableSegmentedThumbBox(box)) return;
  thumbCache.set(persistKey, box);
}

export function clearSegmentedThumbCache(persistKey?: string): void {
  if (persistKey) {
    thumbCache.delete(persistKey);
    return;
  }
  thumbCache.clear();
}

export function isUsableSegmentedThumbBox(box: SegmentedThumbBox): boolean {
  return Number.isFinite(box.left) && Number.isFinite(box.width) && box.width > 0;
}

export function measureSegmentedBox(
  track: { getBoundingClientRect(): { left: number } },
  item: { getBoundingClientRect(): { left: number; width: number } },
): SegmentedThumbBox {
  const trackRect = track.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  return {
    left: itemRect.left - trackRect.left,
    width: itemRect.width,
  };
}

export function segmentedThumbStyle(
  box: SegmentedThumbBox,
  opacity = 1,
): { left: number; width: number; opacity: number } {
  return { left: box.left, width: box.width, opacity };
}

export function segmentedThumbNeedsRestore(
  cached: SegmentedThumbBox | undefined,
  next: SegmentedThumbBox,
  epsilon = 0.5,
): boolean {
  if (!cached || !isUsableSegmentedThumbBox(cached) || !isUsableSegmentedThumbBox(next)) {
    return false;
  }
  return (
    Math.abs(cached.left - next.left) > epsilon ||
    Math.abs(cached.width - next.width) > epsilon
  );
}

export function scheduleSegmentedThumbRestore(
  apply: (box: SegmentedThumbBox) => void,
  next: SegmentedThumbBox,
  raf: (cb: FrameRequestCallback) => number = requestAnimationFrame,
  caf: (id: number) => void = cancelAnimationFrame,
): () => void {
  let inner = 0;
  const outer = raf(() => {
    inner = raf(() => {
      apply(next);
    });
  });
  return () => {
    caf(outer);
    if (inner) caf(inner);
  };
}

export function segmentedItemIndexFromEventTarget(
  track: Element,
  target: EventTarget | null,
): number {
  if (!target || typeof Element === "undefined" || !(target instanceof Element)) {
    return -1;
  }
  const item = target.closest("[data-segmented-item]");
  if (!item || !track.contains(item)) return -1;
  const items = track.querySelectorAll("[data-segmented-item]");
  return Array.prototype.indexOf.call(items, item);
}
