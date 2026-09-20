import { SOCIAL_VIDEO_MAX_BYTES, type SocialVideoContentType } from "@/lib/social-media";
import { formatStoryRecorderClock } from "@/lib/social-story-recorder";

// In-app camera record, then a normal Social video post. Hard ~10 min
// cap. No livestream backend.

export const SOCIAL_GO_LIVE_MAX_MS = 10 * 60 * 1000;
export const SOCIAL_GO_LIVE_VIDEO_BITS_PER_SECOND = 2_500_000;

export function goLiveRemainingMs(
  elapsedMs: number,
  capMs: number = SOCIAL_GO_LIVE_MAX_MS,
): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return capMs;
  return Math.max(0, capMs - elapsedMs);
}

export function goLiveReachedCap(
  elapsedMs: number,
  capMs: number = SOCIAL_GO_LIVE_MAX_MS,
): boolean {
  return goLiveRemainingMs(elapsedMs, capMs) === 0 && elapsedMs >= capMs;
}

export function formatGoLiveClock(ms: number): string {
  return formatStoryRecorderClock(ms);
}

export function goLiveRecorderOptions(rawMime: string): {
  mimeType: string;
  videoBitsPerSecond: number;
} {
  return {
    mimeType: rawMime,
    videoBitsPerSecond: SOCIAL_GO_LIVE_VIDEO_BITS_PER_SECOND,
  };
}

export function goLiveFileName(contentType: SocialVideoContentType): string {
  if (contentType === "video/mp4") return "live.mp4";
  if (contentType === "video/quicktime") return "live.mov";
  return "live.webm";
}

export function goLiveFitsByteCap(
  byteLength: number,
  cap: number = SOCIAL_VIDEO_MAX_BYTES,
): boolean {
  return Number.isFinite(byteLength) && byteLength > 0 && byteLength <= cap;
}
