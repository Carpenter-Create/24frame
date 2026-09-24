"use client";

import { useEffect, useLayoutEffect, useRef, useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SocialStoryReply } from "@/components/social/social-forms";
import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialMediaImage } from "@/components/social/social-media-image";
import { SocialIcon } from "@/components/social/social-icon";
import { BRAND_LOGO_DARK_SRC, BRAND_LOGO_HEIGHT_PX } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { PRODUCT_NAME } from "@/lib/product";
import {
  SOCIAL_STORY_ACTIVATE_NEXT_CLASS,
  SOCIAL_STORY_ACTIVATE_PREV_CLASS,
  SOCIAL_STORY_ACTIVE_CARD_CLASS,
  SOCIAL_STORY_CARET_CLASS,
  SOCIAL_STORY_NEIGHBOR_CARD_CLASS,
  SOCIAL_STORY_PROGRESS_BAR_CLASS,
  SOCIAL_STORY_PROGRESS_FILL_CLASS,
  SOCIAL_STORY_STAGE_CLASS,
  SOCIAL_STORY_STAGE_IN_CLASS,
  SOCIAL_STORY_STILL_PROGRESS_MS,
} from "@/lib/social-chrome";
import { SOCIAL_POST_IMAGE_SIZES, socialVideoDisplaySrc } from "@/lib/social-media-display";
import { SOCIAL, SOCIAL_ROUTES, socialRelativeTime, socialStoryHref } from "@/lib/social";
import type { SocialPostMediaItem } from "@/components/social/social-ui";

export type SocialStoryNeighbor = {
  storyId: string;
  authorName: string;
  authorPhotoUrl: string | null;
  createdAt: string;
  unseen: boolean;
  coverUrl: string | null;
  coverKind: "image" | "video" | null;
};

const STORY_ENTER_KEY = "social-story-enter";

function markStoryEnter(direction: "next" | "prev") {
  try {
    sessionStorage.setItem(STORY_ENTER_KEY, direction);
  } catch {
    // Private mode can refuse storage. The stage still opens.
  }
}

function takeStoryEnter(): "next" | "prev" | "open" {
  if (typeof window === "undefined") return "open";
  try {
    const value = sessionStorage.getItem(STORY_ENTER_KEY);
    sessionStorage.removeItem(STORY_ENTER_KEY);
    if (value === "next" || value === "prev") return value;
  } catch {
    // Same as a cold open.
  }
  return "open";
}

function neighborHref(neighbor: SocialStoryNeighbor | null, itemId: string | null): string | null {
  if (itemId) return socialStoryHref(itemId);
  if (neighbor) return socialStoryHref(neighbor.storyId);
  return null;
}

function StoryCover({
  url,
  kind,
}: {
  url: string | null;
  kind: "image" | "video" | null;
}) {
  if (!url || !kind) return null;
  if (kind === "video") {
    return (
      <video
        data-social-story-cover=""
        muted
        playsInline
        preload="metadata"
        src={socialVideoDisplaySrc(url)}
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
    );
  }
  return (
    <SocialMediaImage src={url} sizes={SOCIAL_POST_IMAGE_SIZES} alt="" />
  );
}

function NeighborCard({
  neighbor,
  direction,
}: {
  neighbor: SocialStoryNeighbor;
  direction: "next" | "prev";
}) {
  return (
    <Link
      href={socialStoryHref(neighbor.storyId)}
      onClick={() => markStoryEnter(direction)}
      data-social-story-neighbor={neighbor.storyId}
      aria-label={neighbor.authorName}
      className={SOCIAL_STORY_NEIGHBOR_CARD_CLASS}
    >
      <span className="absolute inset-0">
        <StoryCover url={neighbor.coverUrl} kind={neighbor.coverKind} />
      </span>
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-2">
        <span
          className={cn(
            "flex size-20 items-center justify-center rounded-full border-[3px] p-0.5",
            neighbor.unseen ? "border-accent" : "border-band-ink/35",
          )}
        >
          <SocialAvatar
            name={neighbor.authorName}
            photoUrl={neighbor.authorPhotoUrl}
            className="size-full"
          />
        </span>
        <span className="max-w-full truncate t-body-sm font-medium text-band-ink">
          {neighbor.authorName}
        </span>
        <span className="t-label text-band-ink/65">{socialRelativeTime(neighbor.createdAt)}</span>
      </span>
    </Link>
  );
}

function StoryVideo({
  src,
  paused,
  muted,
  onAudible,
  onProgress,
}: {
  src: string;
  paused: boolean;
  muted: boolean;
  onAudible: (audible: boolean) => void;
  onProgress: (progress: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let live = true;
    node.muted = muted;
    if (paused) {
      node.pause();
      return () => {
        live = false;
      };
    }
    void node.play().catch(() => {
      if (!live) return;
      node.muted = true;
      void node.play().catch(() => undefined);
    });
    return () => {
      live = false;
    };
  }, [muted, paused, src]);

  return (
    <video
      ref={ref}
      data-social-story-video=""
      autoPlay
      playsInline
      preload="metadata"
      src={socialVideoDisplaySrc(src)}
      className="absolute inset-0 size-full object-cover"
      onTimeUpdate={(event: SyntheticEvent<HTMLVideoElement>) => {
        const node = event.currentTarget;
        if (!node.duration || !Number.isFinite(node.duration)) return;
        onProgress(Math.min(1, node.currentTime / node.duration));
      }}
      onLoadedMetadata={(event: SyntheticEvent<HTMLVideoElement>) => {
        const tracks = (
          event.currentTarget as HTMLVideoElement & { audioTracks?: { length: number } }
        ).audioTracks;
        if (tracks && tracks.length === 0) onAudible(false);
      }}
    />
  );
}

export function SocialStoryViewer({
  storyId,
  authorId,
  authorName,
  authorPhotoUrl,
  createdAt,
  body,
  media,
  prevId,
  nextId,
  prevAuthor,
  nextAuthor,
  index,
  total,
  canReply,
}: {
  storyId: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl: string | null;
  createdAt: string;
  body: string | null;
  media: readonly SocialPostMediaItem[];
  prevId: string | null;
  nextId: string | null;
  prevAuthor: SocialStoryNeighbor | null;
  nextAuthor: SocialStoryNeighbor | null;
  index: number;
  total: number;
  canReply: boolean;
}) {
  const router = useRouter();
  const clip = media[0] ?? null;
  const video = clip?.kind === "video" ? clip : null;
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audible, setAudible] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [enter, setEnter] = useState<"open" | "next" | "prev" | null>(null);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => setEnter(takeStoryEnter()));
    return () => cancelAnimationFrame(frame);
  }, []);
  const bars = Math.max(total, 1);
  const prevTap = neighborHref(prevAuthor, prevId);
  const nextTap = neighborHref(nextAuthor, nextId);
  const prevAuthorHref = prevAuthor ? socialStoryHref(prevAuthor.storyId) : null;
  const nextAuthorHref = nextAuthor ? socialStoryHref(nextAuthor.storyId) : null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, [contenteditable='true']")
      ) {
        return;
      }
      if (event.key === "ArrowLeft" && prevAuthorHref) {
        event.preventDefault();
        markStoryEnter("prev");
        router.push(prevAuthorHref);
      } else if (event.key === "ArrowRight" && nextAuthorHref) {
        event.preventDefault();
        markStoryEnter("next");
        router.push(nextAuthorHref);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextAuthorHref, prevAuthorHref, router]);

  return (
    <div
      data-social-story-stage=""
      className={cn(SOCIAL_STORY_STAGE_CLASS, enter === "open" ? SOCIAL_STORY_STAGE_IN_CLASS : null)}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 hidden items-center justify-between p-4 md:flex">
        {/* eslint-disable-next-line @next/next/no-img-element -- dark-stage wordmark; BrandLogo swaps with theme */}
        <img
          src={BRAND_LOGO_DARK_SRC}
          alt={PRODUCT_NAME}
          height={BRAND_LOGO_HEIGHT_PX}
          data-social-story-mark=""
          className="pointer-events-auto h-6 w-auto"
        />
        <Link
          href={SOCIAL_ROUTES.home}
          aria-label={SOCIAL.stories.close}
          className="pointer-events-auto flex size-12 items-center justify-center text-band-ink"
        >
          <SocialIcon name="x" size={22} />
        </Link>
      </div>
      <div className="flex h-full w-full items-center justify-center md:gap-6">
        {prevAuthor ? <NeighborCard neighbor={prevAuthor} direction="prev" /> : null}
        <article
          data-social-story-viewer={storyId}
          className={cn(
            SOCIAL_STORY_ACTIVE_CARD_CLASS,
            enter === "next" ? SOCIAL_STORY_ACTIVATE_NEXT_CLASS : null,
            enter === "prev" ? SOCIAL_STORY_ACTIVATE_PREV_CLASS : null,
          )}
        >
          {clip?.kind === "image" ? (
            <div data-social-story-frame="" className="absolute inset-0">
              <SocialMediaImage src={clip.url} sizes={SOCIAL_POST_IMAGE_SIZES} alt="" />
            </div>
          ) : null}
          {video ? (
            <div data-social-story-frame="" className="absolute inset-0">
              <StoryVideo
                src={video.url}
                paused={paused}
                muted={muted}
                onAudible={setAudible}
                onProgress={setVideoProgress}
              />
            </div>
          ) : null}
          {!clip && body ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <p className="t-body whitespace-pre-wrap text-band-ink">{body}</p>
            </div>
          ) : null}
          {prevTap ? (
            <Link
              href={prevTap}
              onClick={() => markStoryEnter("prev")}
              aria-label={SOCIAL.stories.previous}
              data-social-story-tap="prev"
              className="absolute inset-y-0 left-0 z-10 w-1/3"
            />
          ) : null}
          {nextTap ? (
            <Link
              href={nextTap}
              onClick={() => markStoryEnter("next")}
              aria-label={SOCIAL.stories.next}
              data-social-story-tap="next"
              className="absolute inset-y-0 right-0 z-10 w-1/3"
            />
          ) : null}
          {prevAuthor ? (
            <Link
              href={socialStoryHref(prevAuthor.storyId)}
              onClick={() => markStoryEnter("prev")}
              aria-label={SOCIAL.stories.previous}
              className={cn(SOCIAL_STORY_CARET_CLASS, "-left-3 -translate-x-1/2")}
            >
              <SocialIcon name="caret-left" size={22} />
            </Link>
          ) : null}
          {nextAuthor ? (
            <Link
              href={socialStoryHref(nextAuthor.storyId)}
              onClick={() => markStoryEnter("next")}
              aria-label={SOCIAL.stories.next}
              className={cn(SOCIAL_STORY_CARET_CLASS, "-right-3 translate-x-1/2")}
            >
              <SocialIcon name="caret-right" size={22} />
            </Link>
          ) : null}
          <div className="absolute inset-x-2 top-2 z-20 flex flex-col gap-2">
            <div className="flex gap-2" data-social-story-progress="">
              {Array.from({ length: bars }, (_, i) => (
                <span
                  key={i}
                  className={cn(SOCIAL_STORY_PROGRESS_BAR_CLASS, "overflow-hidden bg-band-ink/35")}
                >
                  <span
                    data-social-story-progress-fill=""
                    className={cn(
                      "block h-full origin-left bg-band-ink",
                      i === index && !video ? SOCIAL_STORY_PROGRESS_FILL_CLASS : null,
                    )}
                    style={
                      i < index
                        ? { transform: "scaleX(1)" }
                        : i > index
                          ? { transform: "scaleX(0)" }
                          : video
                            ? { transform: `scaleX(${videoProgress})` }
                            : { animationDuration: `${SOCIAL_STORY_STILL_PROGRESS_MS}ms` }
                    }
                  />
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <SocialAvatar
                name={authorName}
                photoUrl={authorPhotoUrl}
                size="sm"
                className="size-8"
              />
              <p className="min-w-0 truncate t-body-sm font-medium text-band-ink">{authorName}</p>
              <p className="shrink-0 t-label text-band-ink/65">{socialRelativeTime(createdAt)}</p>
              <span className="flex-1" />
              {video && audible ? (
                <button
                  type="button"
                  data-social-story-mute=""
                  aria-label={muted ? SOCIAL.stories.unmute : SOCIAL.stories.mute}
                  aria-pressed={muted}
                  className="flex size-10 items-center justify-center text-band-ink"
                  onClick={() => setMuted((value) => !value)}
                >
                  <SocialIcon name={muted ? "speaker-slash" : "speaker-high"} size={20} />
                </button>
              ) : null}
              {video ? (
                <button
                  type="button"
                  data-social-story-pause=""
                  aria-label={paused ? SOCIAL.stories.play : SOCIAL.stories.pause}
                  aria-pressed={paused}
                  className="flex size-10 items-center justify-center text-band-ink"
                  onClick={() => setPaused((value) => !value)}
                >
                  <SocialIcon name={paused ? "play" : "pause"} size={20} />
                </button>
              ) : null}
              <Link
                href={SOCIAL_ROUTES.home}
                aria-label={SOCIAL.stories.close}
                className="flex size-10 items-center justify-center text-band-ink md:hidden"
              >
                <SocialIcon name="x" size={20} />
              </Link>
            </div>
          </div>
          <div className="absolute inset-x-2 bottom-4 z-20 flex items-center gap-4">
            {canReply ? (
              <SocialStoryReply peerId={authorId} placeholder={SOCIAL.stories.replyTo(authorName)} />
            ) : (
              <div className="flex-1" />
            )}
            <span
              data-social-story-heart=""
              className="flex size-10 shrink-0 items-center justify-center text-band-ink"
            >
              <SocialIcon name="heart" size={22} />
            </span>
          </div>
        </article>
        {nextAuthor ? <NeighborCard neighbor={nextAuthor} direction="next" /> : null}
      </div>
    </div>
  );
}
