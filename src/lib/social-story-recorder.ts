import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_VIDEO_CONTENT_TYPES,
  isSocialMediaContentType,
  type SocialMediaContentType,
  type SocialVideoContentType,
} from "@/lib/social-media";

// In-app Stories studio. Probe MediaRecorder.isTypeSupported and persist
// the house type that actually recorded. Never label a webm blob as mp4.
//
// Safari residual (ship a working path; do not remux in this slice):
// - Safari / iOS 14.3+ typically records video/mp4 (H.264). video/webm is
//   not supported there. Chrome / Firefox typically record video/webm.
// - Some Safari builds accept video-only and reject audio+video. The studio
//   tries audio+video, then video-only.
// - Older iOS Safari has no MediaRecorder — Record shows unavailable; Upload
//   stays. getUserMedia still needs HTTPS, a user gesture, and playsInline.
//   Flip stops the live stream before the next getUserMedia (iOS one-stream).
// - Empty blob.type on some Safari versions — persist the probed house type.
// - Do not timeslice. WebKit’s video/mp4 is playable only as the single blob
//   from start() with no slice. Concatenating timesliced chunks has no
//   complete moov: review stays black, then a blurry fragment, and a PUT of
//   that blob can sit forever while the <video> still holds it.
// - Stop the camera before the review element mounts. iOS has one capture
//   pipeline; a live track plus a blob video paints blank.
// - Review must be a different element from the live preview. WebKit prefers
//   srcObject (the camera) over src, so a reused <video> stays black and
//   play() resumes the camera instead of the recorded blob.
// - Do not put a media fragment on the blob URL. WebKit can refuse to load
//   blob:#t= and the stage stays blank. Seek after loadeddata instead.
// - Copy the file bytes before PUT. Safari will not finish reading a blob
//   that is the review video’s src.
// - onstop can beat the last dataavailable. Seal the file after a short flush.
// - Chrome-recorded webm may not play in Safari’s story viewer. No browser
//   remux / AWS IVS / Elemental in this PR.
// - No invented duration cap.
// - Front-camera live preview is mirrored in CSS only. MediaRecorder records
//   the unmirrored stream so viewers see a standard selfie, not a baked flip.
// - Do not request 720x1280. That crops many sensors (especially user-facing)
//   before the preview element paints.

export type StoryStudioFacing = "user" | "environment";

export const SOCIAL_STORY_RECORDER_TYPES = SOCIAL_VIDEO_CONTENT_TYPES;

export function storyStudioMirrorsPreview(facing: StoryStudioFacing): boolean {
  return facing === "user";
}

export function storyRecorderVideoConstraints(
  facing: StoryStudioFacing,
): MediaTrackConstraints {
  return { facingMode: { ideal: facing } };
}

export const SOCIAL_STORY_RECORDER_CANDIDATES = [
  "video/mp4;codecs=avc1.424028,mp4a.40.2",
  "video/mp4;codecs=avc1.42001E,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/quicktime",
] as const;

export type StoryRecorderMime = {
  mimeType: SocialVideoContentType;
  raw: string;
};

export function storyRecorderContentType(raw: string): SocialVideoContentType | null {
  const base = raw.split(";")[0]?.trim().toLowerCase() ?? "";
  return (SOCIAL_STORY_RECORDER_TYPES as readonly string[]).includes(base)
    ? (base as SocialVideoContentType)
    : null;
}

export function probeStoryRecorderMimeType(
  isTypeSupported: ((type: string) => boolean) | undefined,
): StoryRecorderMime | null {
  if (!isTypeSupported) return null;
  for (const raw of SOCIAL_STORY_RECORDER_CANDIDATES) {
    try {
      if (!isTypeSupported(raw)) continue;
    } catch {
      continue;
    }
    const mimeType = storyRecorderContentType(raw);
    if (mimeType) return { mimeType, raw };
  }
  return null;
}

export function resolveStoryRecorderBlobType(
  blobType: string,
  probed: SocialVideoContentType,
): SocialVideoContentType {
  return storyRecorderContentType(blobType) ?? probed;
}

export function storyRecorderFileName(contentType: SocialVideoContentType): string {
  if (contentType === "video/mp4") return "story.mp4";
  if (contentType === "video/quicktime") return "story.mov";
  return "story.webm";
}

export function formatStoryRecorderClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function storyRecorderHoldMs(): number {
  return 220;
}

/** Null means recorder.start() with no timeslice. */
export function storyRecorderTimesliceMs(): number | null {
  return null;
}

/** WebKit can deliver the last dataavailable after onstop. */
export function storyRecorderStopFlushMs(): number {
  return 250;
}

/** A hair past zero makes WebKit paint a frame before play. Seek only. */
export function storyReviewFrameSeconds(): number {
  return 0.001;
}

/** Blob URL with no media fragment. WebKit will not load blob:#t=. */
export function storyReviewMediaSrc(objectUrl: string): string {
  const hash = objectUrl.indexOf("#");
  return hash === -1 ? objectUrl : objectUrl.slice(0, hash);
}

export type StoryReviewVideo = {
  srcObject: unknown;
  src: string;
  muted: boolean;
  playsInline: boolean;
  preload: string;
  load: () => void;
};

/** Camera stream loses. The recorded object URL becomes the media provider. */
export function bindStoryReviewVideo(node: StoryReviewVideo | null, objectUrl: string): void {
  if (!node || !objectUrl) return;
  const src = storyReviewMediaSrc(objectUrl);
  const hadStream = node.srcObject != null;
  node.srcObject = null;
  node.muted = true;
  node.playsInline = true;
  node.preload = "auto";
  // A second load() aborts the in-flight blob fetch. Chromium then stays on a
  // dark frame with the play control. Reload only when a camera stream was
  // attached, or the element is not already pointed at this blob.
  if (!hadStream && node.src === src) return;
  node.src = src;
  node.load();
}

/** Ignore the stop-gesture click that lands on Retake or Post after review mounts. */
export function storyReviewArmMs(): number {
  return 400;
}

type StoryTorchTrack = {
  getCapabilities?: () => object;
  applyConstraints?: (constraints: MediaTrackConstraints) => Promise<void>;
};

/** Hide flash when the live track cannot torch. A dead control is forbidden. */
export function storyCameraSupportsTorch(track: StoryTorchTrack | null | undefined): boolean {
  if (!track?.getCapabilities) return false;
  try {
    const caps = track.getCapabilities() as { torch?: boolean };
    return caps.torch === true;
  } catch {
    return false;
  }
}

export async function setStoryCameraTorch(
  track: StoryTorchTrack | null | undefined,
  on: boolean,
): Promise<boolean> {
  if (!track?.applyConstraints || !storyCameraSupportsTorch(track)) return false;
  try {
    await track.applyConstraints({ advanced: [{ torch: on }] } as unknown as MediaTrackConstraints);
    return true;
  } catch {
    return false;
  }
}

export function storyVideoInputCount(devices: ReadonlyArray<{ kind: string }>): number {
  return devices.filter((device) => device.kind === "videoinput").length;
}

/** House image or video type with no codecs suffix. Null when the base type is not allowlisted. */
export function storyUploadContentType(raw: string): SocialMediaContentType | null {
  const base = raw.split(";")[0]?.trim().toLowerCase() ?? "";
  return isSocialMediaContentType(base) ? base : null;
}

function storyUploadFileName(type: SocialMediaContentType): string {
  if (type === "video/mp4" || type === "video/webm" || type === "video/quicktime") {
    return storyRecorderFileName(type);
  }
  if (type === "image/png") return "story.png";
  if (type === "image/webp") return "story.webp";
  if (type === "image/gif") return "story.gif";
  return "story.jpg";
}

export function prepareStoryUploadFile(file: File): File | "missing" | "type" {
  if (file.size <= 0) return "missing";
  const type = storyUploadContentType(file.type);
  if (!type) return "type";
  if (file.type === type) return file;
  return new File([file], file.name || storyUploadFileName(type), {
    type,
    lastModified: file.lastModified,
  });
}

export function storyUploadNotice(
  reason: "missing" | "type" | "read" | "store",
  kind: "image" | "video" = "video",
): string {
  if (reason === "missing") {
    return kind === "image" ? SOCIAL.stories.photoMissing : SOCIAL.stories.mediaMissing;
  }
  if (reason === "type") {
    return kind === "image" ? SOCIAL.stories.photoMediaType : SOCIAL.stories.mediaType;
  }
  if (reason === "read") return SOCIAL.home.mediaForbidden;
  return SOCIAL.home.uploadFailed;
}

/** Timer via AbortController. Do not call the static timeout helper — older Safari throws. */
export function storyUploadSignal(timeoutMs: number): { signal?: AbortSignal; cancel: () => void } {
  if (typeof AbortController === "undefined") return { cancel() {} };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel() {
      clearTimeout(timer);
    },
  };
}

export function storyUploadTimeoutMs(): number {
  return 120_000;
}

/** Detached bytes. The review element must not be the upload body. */
export async function cloneStoryUploadFile(file: File): Promise<File> {
  const bytes = await file.arrayBuffer();
  return new File([bytes], file.name || storyRecorderFileName("video/webm"), {
    type: file.type,
    lastModified: file.lastModified,
  });
}

export function nextStoryStudioLive(current: number): number {
  return current + 1;
}

export function storyStudioIsLive(current: number, started: number): boolean {
  return current === started;
}

export const STORY_STILL_CONTENT_TYPE = "image/jpeg" as const;

export function storyStillFileName(): string {
  return "story.jpg";
}

export type StoryStillCanvas = {
  width: number;
  height: number;
  getContext(
    contextId: "2d",
  ): { drawImage: (source: unknown, dx: number, dy: number, dw: number, dh: number) => void } | null;
  toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
};

/** One still from the live preview. Unmirrored, same as MediaRecorder. */
export async function captureStoryStillFrame(
  video: { videoWidth: number; videoHeight: number },
  canvas: StoryStillCanvas,
): Promise<File | null> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width <= 0 || height <= 0) return null;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(video, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), STORY_STILL_CONTENT_TYPE, 0.92);
  });
  if (!blob || blob.size <= 0) return null;
  return new File([blob], storyStillFileName(), { type: STORY_STILL_CONTENT_TYPE });
}
