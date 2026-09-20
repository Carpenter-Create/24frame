// Social Mux encode + playback SoT. Client-safe — no token secret.
// Video + Go live posts only. Stories / welcome / Education stay off this module.
// Playback is Auto (adaptive). Do not add a quality Settings maze.

export const SOCIAL_MUX_PROVIDER = "mux" as const;
export const SOCIAL_MUX_ENV = ["MUX_TOKEN_ID", "MUX_TOKEN_SECRET"] as const;
export const SOCIAL_MUX_DEFAULT_RESOLUTION = "1080p" as const;
export const SOCIAL_MUX_ORIGINAL_RESOLUTION = "2160p" as const;
export const SOCIAL_MUX_4K_MIN_EDGE = 2160;
export const SOCIAL_MUX_PLAYBACK_HOST = "stream.mux.com";
export const SOCIAL_MUX_IMAGE_HOST = "image.mux.com";

export const SOCIAL_MUX_ID_RE = /^[A-Za-z0-9_-]{8,120}$/;

export type SocialMuxIntent = "video" | "live";
export type SocialMuxVideoQuality = "basic" | "plus";
export type SocialMuxResolutionTier = "1080p" | "2160p";

export type SocialMuxAssetSettings = {
  videoQuality: SocialMuxVideoQuality;
  maxResolutionTier: SocialMuxResolutionTier;
};

export type SocialMuxMediaFields = {
  provider: typeof SOCIAL_MUX_PROVIDER;
  playbackId: string;
  uploadId?: string;
  assetId?: string;
};

export function isSocialMuxId(value: string): boolean {
  return SOCIAL_MUX_ID_RE.test(value);
}

export function isSocialMux4kSource(width: number, height: number): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return false;
  return Math.max(width, height) >= SOCIAL_MUX_4K_MIN_EDGE;
}

export function parseSocialMuxIntent(raw: string | null | undefined): SocialMuxIntent {
  return raw === "live" ? "live" : "video";
}

export function socialMuxAssetSettings(input: {
  intent?: SocialMuxIntent | null;
  originalQuality?: boolean;
  width?: number;
  height?: number;
}): SocialMuxAssetSettings {
  if (input.intent === "live") {
    return {
      videoQuality: "plus",
      maxResolutionTier: SOCIAL_MUX_DEFAULT_RESOLUTION,
    };
  }
  const fourK =
    Boolean(input.originalQuality) &&
    isSocialMux4kSource(input.width ?? 0, input.height ?? 0);
  return {
    videoQuality: "basic",
    maxResolutionTier: fourK ? SOCIAL_MUX_ORIGINAL_RESOLUTION : SOCIAL_MUX_DEFAULT_RESOLUTION,
  };
}

export function socialMuxPlaybackUrl(playbackId: string): string {
  return `https://${SOCIAL_MUX_PLAYBACK_HOST}/${playbackId}.m3u8`;
}

export function socialMuxThumbnailUrl(playbackId: string): string {
  return `https://${SOCIAL_MUX_IMAGE_HOST}/${playbackId}/thumbnail.webp`;
}

export function probeSocialVideoPixels(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const done = (dims: { width: number; height: number } | null) => {
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      done(Number.isFinite(width) && Number.isFinite(height) ? { width, height } : null);
    };
    video.onerror = () => done(null);
    video.src = url;
  });
}
