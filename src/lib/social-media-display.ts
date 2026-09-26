import { SOCIAL_DESKTOP_MEASURE } from "@/lib/social-chrome";
import { SOCIAL_AVATAR_ROUTE, SOCIAL_MEDIA_ROUTE } from "@/lib/social-edge";

// Display-only Social media helpers. Signing stays in s3-avatars /
// s3-social-media. No upload or recorder changes.
// Feed and cover images follow the shared center column. Below lg the
// column is the full canvas, so the optimizer uses 100vw.

export const SOCIAL_POST_IMAGE_SIZES =
  `(max-width: 1023px) 100vw, ${SOCIAL_DESKTOP_MEASURE.center}px`;
export const SOCIAL_PROFILE_COVER_IMAGE_SIZES = SOCIAL_POST_IMAGE_SIZES;
export const SOCIAL_PROFILE_TILE_IMAGE_SIZES = "(max-width: 768px) 33vw, 297px";
export const SOCIAL_STORY_CARD_IMAGE_SIZES = "(max-width: 768px) 108px, 112px";
export const SOCIAL_OVERVIEW_FACE_IMAGE_SIZES = "32px";

export function socialAvatarImageSizes(size: "sm" | "md" | "lg" | "profile"): string {
  if (size === "sm") return "36px";
  if (size === "lg") return "96px";
  if (size === "profile") return "80px";
  return "48px";
}

/** Animated GIF must skip the optimiser — AVIF/WebP derivatives drop frames. */
export function isAnimatedRasterSrc(src: string): boolean {
  try {
    return new URL(src, "https://local.invalid").pathname.toLowerCase().endsWith(".gif");
  } catch {
    return /\.gif(?:$|[?#])/i.test(src);
  }
}

/**
 * Edge Social reads pass same-origin signer routes, not S3 URLs.
 * next/image's optimiser fetches without the session cookie, so those
 * srcs stay unoptimised — the browser follows the 302 with cookies.
 */
export function isSessionGatedSocialSrc(src: string): boolean {
  const path = src.split("#")[0]?.split("?")[0] ?? "";
  return path === SOCIAL_MEDIA_ROUTE || path.startsWith(`${SOCIAL_AVATAR_ROUTE}/`);
}

/** Local capture preview. Not published Social playback. */
export function isLocalMediaPreviewSrc(src: string): boolean {
  return src.startsWith("blob:") || src.startsWith("data:");
}

export type SocialMediaOrientation = "portrait" | "landscape";

export type SocialMediaFrameInput = {
  kind?: "image" | "video";
  orientation?: SocialMediaOrientation | null;
  width?: number | null;
  height?: number | null;
  aspect?: number | null;
};

function socialMediaAspectRatio(input: SocialMediaFrameInput): number | null {
  if (input.aspect != null && Number.isFinite(input.aspect) && input.aspect > 0) {
    return input.aspect;
  }
  const width = input.width;
  const height = input.height;
  if (
    width == null ||
    height == null ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }
  return width / height;
}

/** Portrait → 4:5. Landscape → 16:9. Prefer real w/h when present. */
export function socialMediaOrientation(
  input: SocialMediaOrientation | SocialMediaFrameInput = {},
): SocialMediaOrientation {
  if (input === "portrait" || input === "landscape") return input;
  if (input.orientation === "portrait" || input.orientation === "landscape") {
    return input.orientation;
  }
  const ratio = socialMediaAspectRatio(input);
  if (ratio != null) return ratio < 1 ? "portrait" : "landscape";
  return input.kind === "image" ? "portrait" : "landscape";
}

/**
 * Feed media frame SoT. Stills, Mux poster, and Mux player.
 * Height is min(70vh, 560px, aspect height). Width stays the container.
 * Portrait crops inside the cap. Landscape follows aspect until the cap.
 * docs/design-locks/social-feed-photo-scale-immersive-lock-v1.md
 * Complete class strings — Tailwind does not see interpolations.
 */
export function socialMediaFrameClass(
  orientation: SocialMediaOrientation | SocialMediaFrameInput,
): string {
  return socialMediaOrientation(orientation) === "portrait"
    ? "aspect-[4/5] h-[min(70vh,560px,calc(100cqw*5/4))] w-full max-h-[min(70vh,560px)] object-cover object-center"
    : "aspect-video h-[min(70vh,560px,calc(100cqw*9/16))] w-full max-h-[min(70vh,560px)] object-cover object-center";
}

/** Story viewer lane only. A portrait story stays tall instead of the feed 16:9 crop. */
export function socialStoryMediaFrameClass(): string {
  return "aspect-[9/16] w-full object-cover";
}

