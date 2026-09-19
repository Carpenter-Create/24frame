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
  HOUSE_SEGMENTED_TRACK_CLASS,
} from "@/lib/house-shell";
import {
  measureSegmentedBox,
  readSegmentedThumbCache,
  scheduleSegmentedThumbRestore,
  segmentedItemIndexFromEventTarget,
  segmentedThumbNeedsRestore,
  segmentedThumbStyle,
  writeSegmentedThumbCache,
} from "@/lib/segmented-track";

export interface SegmentedTrackProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "className"> {
  activeIndex: number;
  persistKey?: string;
  trackClass?: string;
  thumbClass?: string;
  children: ReactNode;
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
  const [visualIndex, setVisualIndex] = useState(activeIndex);
  const [thumbStyle, setThumbStyle] = useState<CSSProperties>(() => {
    const cached = persistKey ? readSegmentedThumbCache(persistKey) : undefined;
    return cached ? segmentedThumbStyle(cached) : { opacity: 0 };
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
    const apply = (box: typeof next, snap = false) => {
      setThumbStyle(
        snap
          ? { ...segmentedThumbStyle(box), transition: "none" }
          : segmentedThumbStyle(box),
      );
    };

    let cancelRestore: (() => void) | undefined;
    if (!placedRef.current) {
      placedRef.current = true;
      const cached = persistKey ? readSegmentedThumbCache(persistKey) : undefined;
      if (cached && segmentedThumbNeedsRestore(cached, next)) {
        apply(cached, true);
        cancelRestore = scheduleSegmentedThumbRestore((box) => apply(box), next);
      } else {
        apply(next, true);
      }
    } else {
      apply(next);
    }

    return () => {
      cancelRestore?.();
      if (!persistKey) return;
      const thumb = track.querySelector("[data-segmented-thumb]");
      if (!thumb) return;
      writeSegmentedThumbCache(persistKey, measureSegmentedBox(track, thumb));
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
