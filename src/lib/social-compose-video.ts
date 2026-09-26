import { SOCIAL } from "@/lib/social";
import {
  socialMediaMaxBytes,
  storyPickFile,
  type SocialMediaKind,
} from "@/lib/social-media";

// Write-compose video attach. Stories already paint a local frame before Mux
// finishes (`storyReviewFrameSeconds` + a muted preview). Post compose uses
// the same frame, plus a still captured from it, so iOS Safari does not sit
// on the empty muted slot.

export type SocialComposeAttachPlan =
  | { ok: true; file: File; kind: SocialMediaKind }
  | { ok: false; error: string };

/** Library picks often omit `file.type`. Map them onto the house allowlist before upload. */
export function planSocialComposeAttach(file: File): SocialComposeAttachPlan {
  const picked = storyPickFile(file);
  if (!picked) return { ok: false, error: SOCIAL.home.mediaType };
  if (picked.file.size <= 0) return { ok: false, error: SOCIAL.home.mediaMissing };
  if (picked.file.size > socialMediaMaxBytes(picked.kind)) {
    return { ok: false, error: SOCIAL.home.mediaTooLarge };
  }
  return { ok: true, file: picked.file, kind: picked.kind };
}

export type SocialComposeSourcePixels = { width: number; height: number };

/**
 * A queued clip may upload only while its pre-registered controller is live.
 * Dismiss aborts that controller before the loop reaches the slot.
 */
export function composeSlotMayUpload(signal: AbortSignal | null | undefined): boolean {
  return signal != null && !signal.aborted;
}

/**
 * Dims from the visible compose preview. Null skips the detached pixel probe
 * so a second decoder cannot blank iOS Safari.
 */
export function composeVideoUploadPixels(
  measured: SocialComposeSourcePixels | null | undefined,
): SocialComposeSourcePixels | null {
  if (!measured) return null;
  const { width, height } = measured;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width: Math.round(width), height: Math.round(height) };
}

/** Attach measured preview pixels so a vertical clip is not stored as a bare video. */
export function stampSocialComposeSourcePixels<T extends object>(
  item: T,
  measured: SocialComposeSourcePixels | null | undefined,
): T & { width?: number; height?: number } {
  const pixels = composeVideoUploadPixels(measured);
  if (!pixels) return item;
  return { ...item, width: pixels.width, height: pixels.height };
}

export function socialComposePosterSize(
  width: number,
  height: number,
  maxEdge = 720,
): { width: number; height: number } | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  const edge = Math.max(width, height);
  const scale = edge > maxEdge ? maxEdge / edge : 1;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export type SocialComposePosterVideo = {
  videoWidth: number;
  videoHeight: number;
};

export type SocialComposePosterCanvas = {
  width: number;
  height: number;
  getContext(
    contextId: "2d",
  ): {
    drawImage: (
      source: SocialComposePosterVideo,
      dx: number,
      dy: number,
      dw: number,
      dh: number,
    ) => void;
  } | null;
  toDataURL: (type?: string, quality?: number) => string;
};

/** One JPEG still from the compose preview. Null when the frame is not readable yet. */
export function paintSocialComposeVideoPoster(
  video: SocialComposePosterVideo,
  canvas: SocialComposePosterCanvas,
): string | null {
  const size = socialComposePosterSize(video.videoWidth, video.videoHeight);
  if (!size) return null;
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  try {
    context.drawImage(video, 0, 0, size.width, size.height);
    const url = canvas.toDataURL("image/jpeg", 0.86);
    return url.startsWith("data:image/") ? url : null;
  } catch {
    return null;
  }
}
