"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  HOUSE_SEGMENTED_THUMB_CLASS,
  HOUSE_SEGMENTED_TRACK_CLASS,
} from "@/lib/house-shell";

export interface SegmentedTrackProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "className"> {
  activeIndex: number;
  trackClass?: string;
  thumbClass?: string;
  children: ReactNode;
}

export function SegmentedTrack({
  activeIndex,
  trackClass = HOUSE_SEGMENTED_TRACK_CLASS,
  thumbClass = HOUSE_SEGMENTED_THUMB_CLASS,
  children,
  ...rest
}: SegmentedTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbStyle, setThumbStyle] = useState<CSSProperties>({ opacity: 0 });

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = track.querySelectorAll<HTMLElement>("[data-segmented-item]");
    const active = items[activeIndex];
    if (!active) return;

    const trackRect = track.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    setThumbStyle({
      left: activeRect.left - trackRect.left,
      width: activeRect.width,
      top: activeRect.top - trackRect.top,
      height: activeRect.height,
      opacity: 1,
    });
  }, [activeIndex]);

  return (
    <div ref={trackRef} className={trackClass} {...rest}>
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
