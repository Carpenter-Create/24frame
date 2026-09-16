"use client";

import { useEffect, useRef } from "react";

import { COURSE_COVER_ASPECT_CLASS } from "@/lib/courses";
import { cn } from "@/lib/cn";

export function CourseLessonPlayer({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    let closed = false;
    let destroy: (() => void) | undefined;
    void import("hls.js").then(({ default: Hls }) => {
      if (closed || !Hls.isSupported() || !videoRef.current) return;
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
      destroy = () => hls.destroy();
    });
    return () => {
      closed = true;
      destroy?.();
    };
  }, [src]);

  return (
    <div
      data-course-playback=""
      className={cn(
        "relative w-full overflow-hidden rounded-[var(--radius)] border border-hairline bg-surface-muted",
        COURSE_COVER_ASPECT_CLASS,
      )}
    >
      <video
        ref={videoRef}
        controls
        playsInline
        className="absolute inset-0 h-full w-full"
        aria-label={title}
      />
    </div>
  );
}
