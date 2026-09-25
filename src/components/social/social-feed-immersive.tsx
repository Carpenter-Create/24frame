"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { SocialCommentTrigger } from "@/components/social/social-comment-thread";
import { SocialLikeButton } from "@/components/social/social-engagement";
import { SocialFeedVideo } from "@/components/social/social-feed-video";
import { SocialIcon } from "@/components/social/social-icon";
import { SocialMediaImage } from "@/components/social/social-media-image";
import type { SocialPostCardModel } from "@/components/social/social-ui";
import { cn } from "@/lib/cn";
import { displayHandle, SOCIAL, socialPostHref } from "@/lib/social";
import {
  SOCIAL_FEED_IMMERSIVE_CAPTION_CLASS,
  SOCIAL_FEED_IMMERSIVE_CLOSE_CLASS,
  SOCIAL_FEED_IMMERSIVE_DOCK_CLASS,
  SOCIAL_FEED_IMMERSIVE_STAGE_CLASS,
  SOCIAL_POST_ACTION_GLYPH,
  SOCIAL_POST_ACTION_HIT_CLASS,
  SOCIAL_POST_ACTIONS_ROW_CLASS,
} from "@/lib/social-chrome";
import {
  shareSocialPostLink,
  socialImmersiveCaptionNeedsMore,
} from "@/lib/social-feed-immersive";

// Tap immersive. One fullscreen stage on phone and desktop.
// docs/design-locks/social-feed-photo-scale-immersive-lock-v1.md
// Share is not Comment. Platform share of the post permalink — the
// IG people sheet stays on social-post-share-sheet-ig and is not forked.

export function SocialPostShareControl({
  postId,
  tone = "canvas",
}: {
  postId: string;
  tone?: "canvas" | "stage";
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      data-social-post-share=""
      data-social-post-share-url={socialPostHref(postId)}
      aria-label={SOCIAL.post.share}
      className={cn(SOCIAL_POST_ACTION_HIT_CLASS, tone === "stage" ? "text-band-ink" : "text-ink-2")}
      onClick={() => {
        if (typeof window === "undefined") return;
        void shareSocialPostLink(postId, window.location.origin).then((result) => {
          setCopied(result === "copied");
        });
      }}
    >
      <SocialIcon name="paper-plane-tilt" size={SOCIAL_POST_ACTION_GLYPH} />
      {copied ? (
        <span className="sr-only" role="status">
          {SOCIAL.profile.shareCopied}
        </span>
      ) : null}
    </button>
  );
}

export function SocialFeedImmersive({
  post,
  index,
  onClose,
}: {
  post: SocialPostCardModel;
  index: number;
  onClose: () => void;
}) {
  const item = post.media[index];
  const [expanded, setExpanded] = useState(false);
  const body = post.body?.trim() ?? "";
  const needsMore = body.length > 0 && socialImmersiveCaptionNeedsMore(body);
  const handle = post.authorHandle ? displayHandle(post.authorHandle).slice(1) : post.authorName;
  const label = item?.kind === "video" ? SOCIAL.post.viewVideo : SOCIAL.post.viewPhoto;

  useEffect(() => {
    const scroller = document.querySelector("[data-house-lead-scroll]");
    const top = scroller instanceof HTMLElement ? scroller.scrollTop : window.scrollY;
    const previous = scroller instanceof HTMLElement ? scroller.style.overflow : "";
    if (scroller instanceof HTMLElement) scroller.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (scroller instanceof HTMLElement) {
        scroller.style.overflow = previous;
        scroller.scrollTop = top;
      } else {
        window.scrollTo(0, top);
      }
    };
  }, [onClose]);

  if (!item) return null;

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-social-feed-immersive=""
      className={SOCIAL_FEED_IMMERSIVE_STAGE_CLASS}
    >
      <div className="absolute inset-0">
        {item.kind === "video" ? (
          <SocialFeedVideo
            item={item}
            fit="contain"
            className="social-feed-immersive-media absolute inset-0 size-full object-contain"
          />
        ) : (
          <SocialMediaImage src={item.url} sizes="100vw" fit="contain" />
        )}
      </div>
      <button
        type="button"
        data-social-feed-immersive-close=""
        aria-label={SOCIAL.post.closeMedia}
        className={SOCIAL_FEED_IMMERSIVE_CLOSE_CLASS}
        onClick={onClose}
      >
        <SocialIcon name="x" size={22} />
      </button>
      <div data-social-feed-immersive-dock="" className={SOCIAL_FEED_IMMERSIVE_DOCK_CLASS}>
        {body ? (
          <div data-social-feed-immersive-caption="">
            <p
              className={cn(
                SOCIAL_FEED_IMMERSIVE_CAPTION_CLASS,
                needsMore && !expanded && "line-clamp-3",
                expanded && "max-h-[40vh] overflow-y-auto whitespace-pre-wrap",
              )}
            >
              <span className="font-medium">{handle} </span>
              {body}
            </p>
            {needsMore && !expanded ? (
              <button
                type="button"
                data-social-feed-immersive-more=""
                className="t-body font-medium text-band-ink"
                onClick={() => setExpanded(true)}
              >
                {SOCIAL.post.captionMore}
              </button>
            ) : null}
          </div>
        ) : null}
        <div data-social-post-actions="" className={SOCIAL_POST_ACTIONS_ROW_CLASS}>
          {post.canLike ? (
            <SocialLikeButton
              postId={post.id}
              liked={post.liked}
              likeCount={post.likeCount}
              groupSlug={post.groupSlug ?? undefined}
              icon
              tone="stage"
            />
          ) : (
            <span className={cn(SOCIAL_POST_ACTION_HIT_CLASS, "text-band-ink")}>
              <SocialIcon name="heart" size={SOCIAL_POST_ACTION_GLYPH} />
            </span>
          )}
          <SocialCommentTrigger
            post={{
              id: post.id,
              commentCount: post.commentCount,
              groupSlug: post.groupSlug,
              canComment: post.canLike,
            }}
            icon
            tone="stage"
          />
          <SocialPostShareControl postId={post.id} tone="stage" />
        </div>
      </div>
    </div>
  );

  return typeof document === "undefined" ? node : createPortal(node, document.body);
}
