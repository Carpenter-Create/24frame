"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";

import { SocialStoryReply } from "@/components/social/social-forms";
import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialMediaImage } from "@/components/social/social-media-image";
import { SocialIcon } from "@/components/social/social-icon";
import { BRAND_LOGO_DARK_SRC, BRAND_LOGO_HEIGHT_PX } from "@/lib/brand";
import { HOUSE_CLIENT_SHELL } from "@/lib/house-client-shell";
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
  SOCIAL_STORY_PROGRESS_ROW_CLASS,
  SOCIAL_STORY_STAGE_CLASS,
  SOCIAL_STORY_STAGE_IN_CLASS,
  SOCIAL_STORY_STILL_PROGRESS_MS,
} from "@/lib/social-chrome";
import { SOCIAL_POST_IMAGE_SIZES, socialVideoDisplaySrc } from "@/lib/social-media-display";
import { markSocialStoryViewed } from "@/app/(app)/social/actions";
import { SOCIAL, SOCIAL_ROUTES, socialRelativeTime, socialStoryHref } from "@/lib/social";
import {
  storyHoldRelease,
  storyTrayCursor,
  storyTrayStep,
  type SocialStoryTrayAuthor,
  type SocialStoryTrayCursor,
} from "@/lib/social-story-tray";
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

function consumeStoryEnter(): "next" | "prev" | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(STORY_ENTER_KEY);
    sessionStorage.removeItem(STORY_ENTER_KEY);
    if (value === "next" || value === "prev") return value;
  } catch {
    // Cold open.
  }
  return null;
}

function storyScreen(node: HTMLElement): HTMLElement | null {
  const screen = node.closest(`[${HOUSE_CLIENT_SHELL.screenAttr}]`);
  return screen instanceof HTMLElement ? screen : null;
}

function storyPlaybackHeld(screen: HTMLElement | null, paused: boolean): boolean {
  return paused || screen?.hasAttribute("hidden") === true;
}

function paintStoryEnter(
  stage: HTMLElement | null,
  direction: "next" | "prev",
  apply: (value: "open" | "next" | "prev" | null) => void,
) {
  // A keep-alive unhide is already in the DOM. Commit the slide class, and
  // restart it when the last hop used the same direction, before paint.
  flushSync(() => apply(null));
  if (stage) void stage.offsetWidth;
  flushSync(() => apply(direction));
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
  onSelect,
}: {
  neighbor: SocialStoryNeighbor;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-social-story-neighbor={neighbor.storyId}
      aria-label={neighbor.authorName}
      className={cn(SOCIAL_STORY_NEIGHBOR_CARD_CLASS, "border-0 p-0 text-left")}
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
    </button>
  );
}

function StoryVideo({
  src,
  paused,
  muted,
  onAudible,
  onForcedMute,
  onProgress,
  onComplete,
}: {
  src: string;
  paused: boolean;
  muted: boolean;
  onAudible: (audible: boolean) => void;
  onForcedMute: () => void;
  onProgress: (progress: number) => void;
  onComplete: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let live = true;
    const screen = storyScreen(node);
    const sync = () => {
      if (!live) return;
      const concealed = screen?.hasAttribute("hidden") === true;
      if (paused || concealed) {
        node.pause();
        return;
      }
      node.muted = muted;
      void node.play().catch(() => {
        if (!live) return;
        // A hide can abort this play(). Do not resume it under the next story.
        if (storyPlaybackHeld(screen, paused)) {
          node.pause();
          return;
        }
        onForcedMute();
        node.muted = true;
        if (!live || storyPlaybackHeld(screen, paused)) {
          node.pause();
          return;
        }
        void node.play().catch(() => {
          if (storyPlaybackHeld(screen, paused)) node.pause();
        });
      });
    };
    sync();
    const observer = screen ? new MutationObserver(sync) : null;
    observer?.observe(screen as HTMLElement, { attributes: true, attributeFilter: ["hidden"] });
    return () => {
      live = false;
      observer?.disconnect();
      node.pause();
    };
  }, [muted, onForcedMute, paused, src]);

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
      onEnded={() => onComplete()}
    />
  );
}

function authorFromNeighbor(neighbor: SocialStoryNeighbor): SocialStoryTrayAuthor {
  return {
    authorId: neighbor.storyId,
    authorName: neighbor.authorName,
    authorPhotoUrl: neighbor.authorPhotoUrl,
    unseen: neighbor.unseen,
    coverUrl: neighbor.coverUrl,
    coverKind: neighbor.coverKind,
    items: [
      {
        id: neighbor.storyId,
        createdAt: neighbor.createdAt,
        body: null,
        media: neighbor.coverUrl
          ? [{ kind: neighbor.coverKind ?? "image", url: neighbor.coverUrl }]
          : [],
      },
    ],
  };
}

function neighborView(
  row: SocialStoryTrayAuthor | undefined,
  edge: "first" | "last",
): SocialStoryNeighbor | null {
  if (!row || row.items.length === 0) return null;
  const target = edge === "first" ? row.items[0] : row.items[row.items.length - 1];
  if (!target) return null;
  return {
    storyId: target.id,
    authorName: row.authorName,
    authorPhotoUrl: row.authorPhotoUrl,
    createdAt: target.createdAt,
    unseen: row.unseen,
    coverUrl: row.coverUrl,
    coverKind: row.coverKind,
  };
}

export function SocialStoryViewer({
  storyId,
  authorId,
  authorName,
  authorPhotoUrl,
  createdAt,
  body,
  media,
  prevAuthor,
  nextAuthor,
  canReply,
  tray,
  selfId,
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
  tray?: readonly SocialStoryTrayAuthor[];
  selfId?: string;
}) {
  const router = useRouter();
  const authors = useMemo(() => {
    if (tray && tray.length > 0) return tray;
    const current: SocialStoryTrayAuthor = {
      authorId,
      authorName,
      authorPhotoUrl,
      unseen: false,
      coverUrl: null,
      coverKind: null,
      items: [{ id: storyId, createdAt, body, media }],
    };
    return [
      ...(prevAuthor ? [authorFromNeighbor(prevAuthor)] : []),
      current,
      ...(nextAuthor ? [authorFromNeighbor(nextAuthor)] : []),
    ];
  }, [
    authorId,
    authorName,
    authorPhotoUrl,
    body,
    createdAt,
    media,
    nextAuthor,
    prevAuthor,
    storyId,
    tray,
  ]);
  const [cursor, setCursor] = useState<SocialStoryTrayCursor>(() => storyTrayCursor(authors, storyId));
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audible, setAudible] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [enter, setEnter] = useState<"open" | "next" | "prev" | null>(null);
  const [hop, setHop] = useState<"next" | "prev" | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<{ x: number; y: number; at: number } | null>(null);
  const suppressClick = useRef(false);
  const forceMute = useCallback(() => setMuted(true), []);
  const author = authors[cursor.author];
  const item = author?.items[cursor.item];
  const clip = item?.media[0] ?? null;
  const video = clip?.kind === "video" ? clip : null;
  const playbackPaused = paused || held;
  const allowReply = !!author && canReply && (!selfId || author.authorId !== selfId);
  const prevNeighbor = neighborView(authors[cursor.author - 1], "last");
  const nextNeighbor = neighborView(authors[cursor.author + 1], "first");
  const prevStep = author ? storyTrayStep(authors, cursor, "prev") : null;
  const nextStep = author ? storyTrayStep(authors, cursor, "next") : null;

  const go = useCallback(
    (direction: "next" | "prev", reason: "manual" | "auto") => {
      const stage = stageRef.current;
      const screen = stage ? storyScreen(stage) : null;
      if (storyPlaybackHeld(screen, false)) return;
      if (reason === "auto" && (paused || held)) return;
      const result = storyTrayStep(authors, cursor, direction);
      if (result === "close") {
        router.push(SOCIAL_ROUTES.home);
        return;
      }
      if (!result) return;
      paintStoryEnter(mediaRef.current, direction, setHop);
      setVideoProgress(0);
      setHeld(false);
      setCursor(result);
    },
    [authors, cursor, held, paused, router],
  );

  const jumpTo = useCallback(
    (authorIndex: number, edge: "first" | "last") => {
      const stage = stageRef.current;
      const screen = stage ? storyScreen(stage) : null;
      if (storyPlaybackHeld(screen, false)) return;
      const row = authors[authorIndex];
      if (!row || row.items.length === 0) return;
      const direction = authorIndex >= cursor.author ? "next" : "prev";
      paintStoryEnter(mediaRef.current, direction, setHop);
      setVideoProgress(0);
      setHeld(false);
      setCursor({
        author: authorIndex,
        item: edge === "first" ? 0 : row.items.length - 1,
      });
    },
    [authors, cursor.author],
  );

  useLayoutEffect(() => {
    const direction = consumeStoryEnter();
    // The 180ms fade must be on the frame the browser paints. A later frame flashes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- commit enter before paint
    if (direction) setHop(direction);
    else setEnter("open");
  }, [storyId]);
  useEffect(() => {
    const stage = stageRef.current;
    const screen = stage ? storyScreen(stage) : null;
    if (!screen) return;
    const observer = new MutationObserver(() => {
      if (screen.hasAttribute("hidden")) return;
      const direction = consumeStoryEnter();
      if (direction) paintStoryEnter(mediaRef.current, direction, setHop);
    });
    observer.observe(screen, { attributes: true, attributeFilter: ["hidden"] });
    return () => observer.disconnect();
  }, [storyId]);
  useEffect(() => {
    if (!item || item.id === storyId) return;
    const href = socialStoryHref(item.id);
    if (window.location.pathname !== href) {
      window.history.replaceState(window.history.state, "", href);
    }
    void markSocialStoryViewed(item.id);
  }, [item, storyId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const stage = stageRef.current;
      const screen = stage ? storyScreen(stage) : null;
      // A paused visible story still takes arrows. A hidden keep-alive twin must not.
      if (storyPlaybackHeld(screen, false)) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, [contenteditable='true']")
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go("prev", "manual");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        go("next", "manual");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  function onZonePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    holdRef.current = { x: event.clientX, y: event.clientY, at: performance.now() };
    setHeld(true);
  }

  function onZonePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = holdRef.current;
    holdRef.current = null;
    setHeld(false);
    if (!start) return;
    const bounds = mediaRef.current?.getBoundingClientRect();
    const release = storyHoldRelease({
      elapsedMs: performance.now() - start.at,
      dx: event.clientX - start.x,
      dy: event.clientY - start.y,
      width: bounds?.width ?? 0,
      x: event.clientX - (bounds?.left ?? 0),
    });
    suppressClick.current = true;
    if (release === "resume") return;
    go(release, "manual");
  }

  function onZoneClick(direction: "next" | "prev") {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    go(direction, "manual");
  }

  if (!author || !item) return null;

  return (
    <div
      ref={stageRef}
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
        {prevNeighbor ? (
          <NeighborCard neighbor={prevNeighbor} onSelect={() => jumpTo(cursor.author - 1, "last")} />
        ) : null}
        <article data-social-story-viewer={item.id} className={SOCIAL_STORY_ACTIVE_CARD_CLASS}>
          <div
            ref={mediaRef}
            data-social-story-frame=""
            className={cn(
              "absolute inset-0",
              hop === "next" ? SOCIAL_STORY_ACTIVATE_NEXT_CLASS : null,
              hop === "prev" ? SOCIAL_STORY_ACTIVATE_PREV_CLASS : null,
            )}
          >
            {clip?.kind === "image" ? (
              <SocialMediaImage key={item.id} src={clip.url} sizes={SOCIAL_POST_IMAGE_SIZES} alt="" />
            ) : null}
            {video ? (
              <StoryVideo
                key={item.id}
                src={video.url}
                paused={playbackPaused}
                muted={muted}
                onAudible={setAudible}
                onForcedMute={forceMute}
                onProgress={setVideoProgress}
                onComplete={() => go("next", "auto")}
              />
            ) : null}
            {!clip && item.body ? (
              <div className="flex h-full items-center justify-center px-6 text-center">
                <p className="t-body whitespace-pre-wrap text-band-ink">{item.body}</p>
              </div>
            ) : null}
            <button
              type="button"
              aria-label={SOCIAL.stories.previous}
              data-social-story-tap="prev"
              className="absolute inset-y-0 left-0 z-10 w-1/3"
              onPointerDown={onZonePointerDown}
              onPointerUp={onZonePointerUp}
              onClick={() => onZoneClick("prev")}
            />
            <button
              type="button"
              aria-label={SOCIAL.stories.next}
              data-social-story-tap="next"
              className="absolute inset-y-0 right-0 z-10 w-2/3"
              onPointerDown={onZonePointerDown}
              onPointerUp={onZonePointerUp}
              onClick={() => onZoneClick("next")}
            />
          </div>
          {prevStep ? (
            <button
              type="button"
              aria-label={SOCIAL.stories.previous}
              className={cn(SOCIAL_STORY_CARET_CLASS, "-left-3 -translate-x-1/2 border-0")}
              onClick={() => go("prev", "manual")}
            >
              <SocialIcon name="caret-left" size={22} />
            </button>
          ) : null}
          {nextStep ? (
            <button
              type="button"
              aria-label={SOCIAL.stories.next}
              className={cn(SOCIAL_STORY_CARET_CLASS, "-right-3 translate-x-1/2 border-0")}
              onClick={() => go("next", "manual")}
            >
              <SocialIcon name="caret-right" size={22} />
            </button>
          ) : null}
          <div className="absolute inset-x-2 top-2 z-20 flex flex-col gap-2">
            <div className={SOCIAL_STORY_PROGRESS_ROW_CLASS} data-social-story-progress="">
              {author.items.map((segment, i) => (
                <span
                  key={segment.id}
                  className={cn(SOCIAL_STORY_PROGRESS_BAR_CLASS, "overflow-hidden bg-band-ink/35")}
                >
                  <span
                    data-social-story-progress-fill=""
                    className={cn(
                      "block h-full origin-left bg-band-ink",
                      i === cursor.item && !video ? SOCIAL_STORY_PROGRESS_FILL_CLASS : null,
                    )}
                    style={
                      i < cursor.item
                        ? { transform: "scaleX(1)" }
                        : i > cursor.item
                          ? { transform: "scaleX(0)" }
                          : video
                            ? { transform: `scaleX(${videoProgress})` }
                            : {
                                animationDuration: `${SOCIAL_STORY_STILL_PROGRESS_MS}ms`,
                                animationPlayState: playbackPaused ? "paused" : "running",
                              }
                    }
                    onAnimationEnd={() => {
                      if (i !== cursor.item || video) return;
                      go("next", "auto");
                    }}
                  />
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <SocialAvatar
                name={author.authorName}
                photoUrl={author.authorPhotoUrl}
                size="sm"
                className="size-8"
              />
              <p className="min-w-0 truncate t-body-sm font-medium text-band-ink">{author.authorName}</p>
              <p className="shrink-0 t-label text-band-ink/65">{socialRelativeTime(item.createdAt)}</p>
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
            {allowReply ? (
              <SocialStoryReply
                peerId={author.authorId}
                placeholder={SOCIAL.stories.replyTo(author.authorName)}
              />
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
        {nextNeighbor ? (
          <NeighborCard neighbor={nextNeighbor} onSelect={() => jumpTo(cursor.author + 1, "first")} />
        ) : null}
      </div>
    </div>
  );
}

