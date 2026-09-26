import {
  createSocialMuxUpload,
  finalizeSocialMuxUpload,
  presignSocialMediaUpload,
} from "@/app/(app)/social/actions";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_MEDIA_MAX_ITEMS,
  socialMediaKindFor,
  type SocialMediaItem,
  type SocialMediaLane,
} from "@/lib/social-media";
import { probeSocialVideoPixels, SOCIAL_MUX_PROVIDER, type SocialMuxIntent } from "@/lib/social-mux";

// One client upload helper for Social posts and story video.
// Images stay on the media S3 lane. Video goes to Mux.

export type SocialPostUploadOptions = {
  intent?: SocialMuxIntent;
  originalQuality?: boolean;
};

export async function uploadSocialPostMedia(
  files: ArrayLike<File> | null,
  current: SocialMediaItem[],
  max: number = SOCIAL_MEDIA_MAX_ITEMS,
  lane: SocialMediaLane = "posts",
  options: SocialPostUploadOptions = {},
): Promise<{ items?: SocialMediaItem[]; error?: string }> {
  if (!files || files.length === 0) return {};
  const remaining = max - current.length;
  if (remaining <= 0) return { error: SOCIAL.home.mediaLimit };
  const chosen = Array.from(files).slice(0, remaining);
  const next: SocialMediaItem[] = [];
  for (const file of chosen) {
    const kind = socialMediaKindFor(file.type);
    if (kind === "video" && (lane === "posts" || lane === "stories")) {
      const uploaded = await uploadSocialMuxVideoFile(file, { ...options, lane });
      if (uploaded.error || !uploaded.item) return { error: uploaded.error ?? SOCIAL.home.uploadFailed };
      next.push(uploaded.item);
      continue;
    }
    const uploaded = await uploadSocialS3Media(file, lane);
    if (uploaded.error || !uploaded.item) return { error: uploaded.error ?? SOCIAL.home.uploadFailed };
    next.push(uploaded.item);
  }
  return { items: next };
}

async function uploadSocialS3Media(
  file: File,
  lane: SocialMediaLane,
): Promise<{ item?: SocialMediaItem; error?: string }> {
  const body = new FormData();
  body.set("content_type", file.type);
  body.set("byte_length", String(file.size));
  body.set("lane", lane);
  let signed: Awaited<ReturnType<typeof presignSocialMediaUpload>>;
  try {
    signed = await presignSocialMediaUpload(body);
  } catch {
    return { error: SOCIAL.home.uploadFailed };
  }
  if (signed.error || !signed.url || !signed.key || !signed.kind || !signed.contentType) {
    return { error: signed.error ?? SOCIAL.home.uploadFailed };
  }
  let put: Response;
  try {
    put = await fetch(signed.url, {
      method: "PUT",
      headers: { "Content-Type": signed.contentType },
      body: file,
    });
  } catch {
    return { error: SOCIAL.home.uploadFailed };
  }
  if (!put.ok) return { error: SOCIAL.home.uploadFailed };
  return {
    item: {
      kind: signed.kind as SocialMediaItem["kind"],
      key: signed.key,
      contentType: signed.contentType as SocialMediaItem["contentType"],
    },
  };
}

export async function uploadSocialMuxVideoFile(
  file: File,
  options: SocialPostUploadOptions & { lane?: SocialMediaLane; signal?: AbortSignal } = {},
): Promise<{ item?: SocialMediaItem; error?: string }> {
  const lane = options.lane ?? "posts";
  const pixels = await probeSocialVideoPixels(file);
  const body = new FormData();
  body.set("content_type", file.type);
  body.set("byte_length", String(file.size));
  body.set("lane", lane);
  body.set("intent", options.intent ?? "video");
  if (options.originalQuality) body.set("original_quality", "1");
  if (pixels) {
    body.set("source_width", String(pixels.width));
    body.set("source_height", String(pixels.height));
  }
  let created: Awaited<ReturnType<typeof createSocialMuxUpload>>;
  try {
    created = await createSocialMuxUpload(body);
  } catch {
    return { error: SOCIAL.home.uploadFailed };
  }
  if (created.error || !created.url || !created.key || !created.uploadId || !created.contentType) {
    return { error: created.error ?? SOCIAL.home.uploadFailed };
  }
  let put: Response;
  try {
    put = await fetch(created.url, {
      method: "PUT",
      headers: { "Content-Type": created.contentType },
      body: file,
      signal: options.signal,
    });
  } catch {
    return { error: SOCIAL.home.uploadFailed };
  }
  if (!put.ok) return { error: SOCIAL.home.uploadFailed };

  const finish = new FormData();
  finish.set("upload_id", created.uploadId);
  finish.set("key", created.key);
  finish.set("content_type", created.contentType);
  let ready: Awaited<ReturnType<typeof finalizeSocialMuxUpload>>;
  try {
    ready = await finalizeSocialMuxUpload(finish);
  } catch {
    return { error: SOCIAL.home.videoPreparing };
  }
  if (ready.error || !ready.item?.playbackId) {
    return { error: ready.error ?? SOCIAL.home.videoPreparing };
  }
  return {
    item: {
      ...ready.item,
      provider: SOCIAL_MUX_PROVIDER,
    },
  };
}
