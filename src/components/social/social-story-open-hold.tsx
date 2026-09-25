"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { flushSync } from "react-dom";

import {
  SOCIAL_STORY_MEDIA_PAINTED,
  storyOpenHoldSrc,
} from "@/lib/social-story-open-hold";

// docs/design-locks/stories-open-smooth-lock-v1.md
// The story route's loading frame replaces the page. This hold lives on the
// Social layout, which stays mounted, and keeps the rail still up until the
// viewer reports real pixels.

export function SocialStoryOpenHold() {
  const pathname = usePathname();
  const [src, setSrc] = useState<string | null>(null);
  const [trackedPath, setTrackedPath] = useState(pathname);
  const onStory =
    pathname.startsWith("/social/stories/") && !pathname.startsWith("/social/stories/new");
  if (pathname !== trackedPath) {
    setTrackedPath(pathname);
    if (!onStory) setSrc(null);
  }

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest("a[data-social-story-card]");
      if (!(card instanceof HTMLElement)) return;
      const next = storyOpenHoldSrc(card);
      if (!next) return;
      flushSync(() => setSrc(next));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const onPaint = () => setSrc(null);
    window.addEventListener(SOCIAL_STORY_MEDIA_PAINTED, onPaint);
    return () => window.removeEventListener(SOCIAL_STORY_MEDIA_PAINTED, onPaint);
  }, []);

  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- rail still, already session-gated or public
    <img
      src={src}
      alt=""
      data-social-story-open-hold=""
      className="pointer-events-none fixed inset-0 z-[70] size-full object-cover"
    />
  );
}
