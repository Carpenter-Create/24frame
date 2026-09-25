import { socialPostHref } from "@/lib/social";

// Feed photo scale + tap immersive.
// docs/design-locks/social-feed-photo-scale-immersive-lock-v1.md
// Share here is the post permalink handed to the platform share sheet
// (the share lock's Share to… path). It is not the comment thread.
// The IG multi-select people sheet stays on its own lock and is not
// forked into this face.

const IMMERSIVE_CAPTION_LINES = 3;
const IMMERSIVE_CAPTION_CHARS = 140;

export function socialImmersiveCaptionNeedsMore(body: string): boolean {
  if (body.split("\n").length > IMMERSIVE_CAPTION_LINES) return true;
  return body.length > IMMERSIVE_CAPTION_CHARS;
}

export function socialPostShareUrl(postId: string, origin: string): string {
  return new URL(socialPostHref(postId), origin).toString();
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function shareSocialPostLink(
  postId: string,
  origin: string,
): Promise<"shared" | "copied" | "aborted"> {
  const url = socialPostShareUrl(postId, origin);
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ url });
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "aborted";
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
  }
  return "copied";
}
