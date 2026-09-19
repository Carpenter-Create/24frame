"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

import {
  HOUSE_SEGMENTED_THUMB_CLASS,
  HOUSE_SEGMENTED_THUMB_DURATION_MS,
  HOUSE_SEGMENTED_TRACK_CLASS,
} from "@/lib/house-shell";
import {
  measureSegmentedBox,
  projectSegmentedThumbFlight,
  readSegmentedThumbFlight,
  scheduleSegmentedThumbRestore,
  segmentedItemIndexFromEventTarget,
  segmentedThumbFirstPaintBox,
  segmentedThumbNeedsRestore,
  segmentedThumbRestoreSource,
  segmentedThumbStyle,
  startSegmentedThumbFlight,
  writeSegmentedThumbPainted,
  type SegmentedThumbBox,
} from "@/lib/segmented-track";

export interface SegmentedTrackProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "className"> {
  activeIndex: number;
  persistKey?: string;
  trackClass?: string;
  thumbClass?: string;
  children: ReactNode;
}

function thumbCss(
  box: SegmentedThumbBox,
  snap = false,
  durationMs?: number,
): CSSProperties {
  if (snap) return { ...segmentedThumbStyle(box), transition: "none" };
  if (durationMs != null) {
    return { ...segmentedThumbStyle(box), transitionDuration: `${durationMs}ms` };
  }
  return segmentedThumbStyle(box);
}

export function SegmentedTrack({
  activeIndex,
  persistKey,
  trackClass = HOUSE_SEGMENTED_TRACK_CLASS,
  thumbClass = HOUSE_SEGMENTED_THUMB_CLASS,
  children,
  onClickCapture,
  ...rest
}: SegmentedTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const placedRef = useRef(false);
  const routeIndexRef = useRef(activeIndex);
  const lastBoxRef = useRef<SegmentedThumbBox | undefined>(undefined);
  const [visualIndex, setVisualIndex] = useState(activeIndex);
  const [thumbStyle, setThumbStyle] = useState<CSSProperties>(() => {
    if (!persistKey) return { opacity: 0 };
    const box = segmentedThumbFirstPaintBox(persistKey);
    return box ? segmentedThumbStyle(box) : { opacity: 0 };
  });

  useLayoutEffect(() => {
    if (routeIndexRef.current === activeIndex) return;
    routeIndexRef.current = activeIndex;
    setVisualIndex(activeIndex);
  }, [activeIndex]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const items = track.querySelectorAll<HTMLElement>("[data-segmented-item]");
    const active = items[visualIndex];
    if (!active) return undefined;

    const next = measureSegmentedBox(track, active);
    const now = typeof performance === "undefined" ? 0 : performance.now();
    const apply = (box: SegmentedThumbBox, snap = false, durationMs?: number) => {
      lastBoxRef.current = box;
      setThumbStyle(thumbCss(box, snap, durationMs));
    };

    let cancelRestore: (() => void) | undefined;
    if (!placedRef.current) {
      placedRef.current = true;
      const restore = persistKey
        ? segmentedThumbRestoreSource(persistKey, next, now)
        : undefined;
      if (persistKey && restore) {
        apply(restore.box, true);
        startSegmentedThumbFlight(
          persistKey,
          restore.box,
          next,
          now,
          restore.remainingMs,
        );
        cancelRestore = scheduleSegmentedThumbRestore(
          (box) => apply(box, false, restore.remainingMs),
          next,
        );
      } else {
        apply(next, true);
      }
    } else {
      const flight = persistKey ? readSegmentedThumbFlight(persistKey) : undefined;
      const view = flight ? projectSegmentedThumbFlight(flight, now) : undefined;
      const from = view && !view.done ? view.box : lastBoxRef.current;
      if (persistKey && from && segmentedThumbNeedsRestore(from, next)) {
        startSegmentedThumbFlight(
          persistKey,
          from,
          next,
          now,
          HOUSE_SEGMENTED_THUMB_DURATION_MS,
        );
      }
      apply(next);
    }

    return () => {
      cancelRestore?.();
      if (!persistKey) return;
      const thumb = track.querySelector("[data-segmented-thumb]");
      if (!thumb) return;
      writeSegmentedThumbPainted(persistKey, measureSegmentedBox(track, thumb));
    };
  }, [visualIndex, persistKey]);

  function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (track) {
      const index = segmentedItemIndexFromEventTarget(track, event.target);
      if (index >= 0) setVisualIndex(index);
    }
    onClickCapture?.(event);
  }

  return (
    <div
      {...rest}
      ref={trackRef}
      className={trackClass}
      data-segmented-persist={persistKey}
      onClickCapture={handleClickCapture}
    >
      <div
        data-segmented-thumb=""
        className={thumbClass}
        style={thumbStyle}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

export { HOUSE_SEGMENTED_TRACK_CLASS, HOUSE_SEGMENTED_THUMB_CLASS };
