import { SOCIAL_AVATAR_ROUTE, SOCIAL_MEDIA_ROUTE } from "@/lib/social-edge";

// Display-only Social media helpers. Signing stays in s3-avatars /
// s3-social-media. No upload or recorder changes.

export const SOCIAL_POST_IMAGE_SIZES = "(max-width: 768px) 100vw, 892px";
export const SOCIAL_PROFILE_COVER_IMAGE_SIZES = "(max-width: 768px) 100vw, 892px";
export const SOCIAL_PROFILE_TILE_IMAGE_SIZES = "(max-width: 768px) 33vw, 297px";
export const SOCIAL_STORY_CARD_IMAGE_SIZES = "(max-width: 768px) 108px, 112px";
export const SOCIAL_OVERVIEW_FACE_IMAGE_SIZES = "32px";

export function socialAvatarImageSizes(size: "sm" | "md" | "lg" | "profile"): string {
  if (size === "sm") return "36px";
  if (size === "lg") return "96px";
  if (size === "profile") return "(max-width: 768px) 72px, 88px";
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

/**
 * Media fragment so the browser can paint a first frame without a stored
 * poster object. Hash is client-only — signed query params stay intact.
 */
export function socialVideoDisplaySrc(src: string): string {
  if (!src || src.includes("#")) return src;
  return `${src}#t=0.1`;
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

/** Feed media frame SoT. Stills, Mux poster, Mux player, native video. */
export function socialMediaFrameClass(
  orientation: SocialMediaOrientation | SocialMediaFrameInput,
): string {
  return socialMediaOrientation(orientation) === "portrait"
    ? "aspect-[4/5] w-full object-cover"
    : "aspect-video w-full object-cover";
}

