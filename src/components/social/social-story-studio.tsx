"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";

import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialAvatar } from "./social-avatar";
import { SocialIcon } from "./social-icon";
import {
  createSocialStory,
  presignSocialMediaUpload,
} from "@/app/(app)/social/actions";
import {
  SOCIAL_STORY_CREATE_BACK_CLASS,
  SOCIAL_STORY_CREATE_CARDS_CLASS,
  SOCIAL_STORY_CREATE_CLOSE_CLASS,
  SOCIAL_STORY_CREATE_HOST_CLASS,
  SOCIAL_STORY_CREATE_ICON_WELL_CLASS,
  SOCIAL_STORY_CREATE_IDENTITY_CLASS,
  SOCIAL_STORY_CREATE_LABEL_CLASS,
  SOCIAL_STORY_CREATE_NAME_CLASS,
  SOCIAL_STORY_CREATE_RAIL_CLASS,
  SOCIAL_STORY_CREATE_SECONDARY_CLASS,
  SOCIAL_STORY_CREATE_SECONDARY_COLUMN_CLASS,
  SOCIAL_STORY_CREATE_STAGE_CLASS,
  SOCIAL_STORY_CREATE_TITLE_CLASS,
  SOCIAL_STORY_PHOTO_CARD_CLASS,
  SOCIAL_STORY_PICKER_ROW_CLASS,
  SOCIAL_STORY_PICKER_WELL_CLASS,
  SOCIAL_STORY_SHARE_ACTIONS_CLASS,
  SOCIAL_STORY_SHARE_POST_CLASS,
  SOCIAL_STORY_SHARE_PREVIEW_CLASS,
  SOCIAL_STORY_SHARE_RETAKE_CLASS,
  SOCIAL_STORY_VIDEO_CARD_CLASS,
  SOCIAL_STORY_POSTED_CLASS,
  SOCIAL_STORY_REC_PILL_CLASS,
  SOCIAL_STORY_RECORD_CLASS,
  SOCIAL_STORY_STOP_CLASS,
  SOCIAL_STORY_STUDIO_CHROME_CLASS,
  SOCIAL_STORY_STUDIO_CLASS,
  SOCIAL_STORY_STUDIO_ICON_CLASS,
  SOCIAL_STORY_STUDIO_REVIEW_CLASS,
  SOCIAL_STORY_STUDIO_RING_CLASS,
  SOCIAL_STORY_STUDIO_STAGE_CLASS,
  socialStoryStudioPreviewClass,
} from "@/lib/social-chrome";
import {
  SOCIAL_ICON_SIZE_STORY_PICKER,
  SOCIAL_ICON_SIZE_STORY_PLAY,
  SOCIAL_ICON_SIZE_STORY_POSTED,
  SOCIAL_ICON_SIZE_STORY_STUDIO,
} from "@/lib/social-icons";
import {
  SOCIAL_IMAGE_CONTENT_TYPES,
  SOCIAL_IMAGE_MAX_BYTES,
  SOCIAL_VIDEO_CONTENT_TYPES,
  SOCIAL_VIDEO_MAX_BYTES,
  socialMediaKindFor,
  type SocialMediaContentType,
  type SocialMediaItem,
  type SocialMediaKind,
  type SocialVideoContentType,
} from "@/lib/social-media";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import {
  formatStoryRecorderClock,
  nextStoryStudioLive,
  probeStoryRecorderMimeType,
  resolveStoryRecorderBlobType,
  storyRecorderFileName,
  storyRecorderHoldMs,
  storyRecorderVideoConstraints,
  storyStudioIsLive,
  storyStudioMirrorsPreview,
  type StoryStudioFacing,
} from "@/lib/social-story-recorder";

type StudioPhase = "stage" | "photo" | "video" | "preview" | "recording" | "review" | "posted";

type ReviewClip = {
  file: File;
  url: string;
  contentType: SocialMediaContentType;
  kind: SocialMediaKind;
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function uploadStoryMedia(file: File): Promise<{ item?: SocialMediaItem; error?: string }> {
  const body = new FormData();
  body.set("content_type", file.type);
  body.set("byte_length", String(file.size));
  body.set("lane", "stories");
  const signed = await presignSocialMediaUpload(body);
  if (signed.error || !signed.url || !signed.key || !signed.kind || !signed.contentType) {
    return { error: signed.error ?? SOCIAL.home.uploadFailed };
  }
  const put = await fetch(signed.url, {
    method: "PUT",
    headers: { "Content-Type": signed.contentType },
    body: file,
  });
  if (!put.ok) return { error: SOCIAL.home.uploadFailed };
  const kind = socialMediaKindFor(file.type);
  if (kind !== "image" && kind !== "video") return { error: SOCIAL.home.uploadFailed };
  return {
    item: {
      kind,
      key: signed.key,
      contentType: signed.contentType as SocialMediaContentType,
    },
  };
}

export function SocialStoryCompose({
  displayName = SOCIAL.stories.you,
  photoUrl = null,
}: {
  displayName?: string;
  photoUrl?: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reviewRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoLibraryRef = useRef<HTMLInputElement>(null);
  const photoCaptureRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartedRef = useRef(0);
  const clockStartedRef = useRef(0);
  const clockTimerRef = useRef<number | null>(null);
  const mimeRef = useRef<SocialVideoContentType>("video/webm");
  const recordingRef = useRef(false);
  const clipUrlRef = useRef<string | null>(null);
  const liveRef = useRef(0);
  const postRef = useRef(0);

  const [phase, setPhase] = useState<StudioPhase>("stage");
  const [facing, setFacing] = useState<StoryStudioFacing>("user");
  const [error, setError] = useState("");
  const [clock, setClock] = useState("0:00");
  const [clip, setClip] = useState<ReviewClip | null>(null);
  const [playing, setPlaying] = useState(false);
  const [posting, setPosting] = useState(false);

  function clearHold() {
    if (holdTimerRef.current != null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function clearClock() {
    if (clockTimerRef.current != null) {
      window.clearInterval(clockTimerRef.current);
      clockTimerRef.current = null;
    }
    setClock("0:00");
  }

  function releasePreview() {
    liveRef.current = nextStoryStudioLive(liveRef.current);
    recordingRef.current = false;
    clearHold();
    clearClock();
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // already stopped
        }
      }
    }
    recorderRef.current = null;
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function releaseClip() {
    if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    clipUrlRef.current = null;
    setClip(null);
    setPlaying(false);
  }

  useEffect(() => {
    return () => {
      releasePreview();
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    };
    // Unmount-only teardown. Live refs hold the current stream / recorder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    const stream = streamRef.current;
    if (!node || !stream) return;
    if (phase !== "preview" && phase !== "recording") return;
    node.srcObject = stream;
    node.muted = true;
    node.playsInline = true;
    void node.play().catch(() => undefined);
  }, [phase]);

  async function acquireStream(nextFacing: StoryStudioFacing): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(SOCIAL.stories.unavailable);
    }
    const video = storyRecorderVideoConstraints(nextFacing);
    try {
      return await navigator.mediaDevices.getUserMedia({ video, audio: true });
    } catch {
      return navigator.mediaDevices.getUserMedia({ video, audio: false });
    }
  }

  async function attachPreview(nextFacing: StoryStudioFacing, live: number) {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const stream = await acquireStream(nextFacing);
    if (!storyStudioIsLive(liveRef.current, live)) {
      stopStream(stream);
      return false;
    }
    streamRef.current = stream;
    const node = videoRef.current;
    if (node) {
      node.srcObject = stream;
      node.muted = true;
      node.playsInline = true;
      await node.play().catch(() => undefined);
    }
    return true;
  }

  async function openStudio() {
    setError("");
    const probed = probeStoryRecorderMimeType(
      typeof MediaRecorder !== "undefined" ? MediaRecorder.isTypeSupported.bind(MediaRecorder) : undefined,
    );
    if (!probed || typeof MediaRecorder === "undefined") {
      setError(SOCIAL.stories.unavailable);
      return;
    }
    mimeRef.current = probed.mimeType;
    const live = nextStoryStudioLive(liveRef.current);
    liveRef.current = live;
    setPhase("preview");
    try {
      const opened = await attachPreview(facing, live);
      if (!opened && storyStudioIsLive(liveRef.current, live)) {
        setPhase("video");
      }
    } catch {
      if (!storyStudioIsLive(liveRef.current, live)) return;
      releasePreview();
      setPhase("video");
      setError(SOCIAL.stories.permission);
    }
  }

  async function flipCamera() {
    if (phase !== "preview" || recordingRef.current) return;
    const next = facing === "user" ? "environment" : "user";
    const live = liveRef.current;
    try {
      const flipped = await attachPreview(next, live);
      if (flipped) setFacing(next);
    } catch {
      if (!storyStudioIsLive(liveRef.current, live)) return;
      try {
        await attachPreview(facing, live);
      } catch {
        setError(SOCIAL.stories.permission);
      }
    }
  }

  function startClock() {
    clockStartedRef.current = Date.now();
    clearClock();
    setClock("0:00");
    clockTimerRef.current = window.setInterval(() => {
      setClock(formatStoryRecorderClock(Date.now() - clockStartedRef.current));
    }, 250);
  }

  function startRecording() {
    const stream = streamRef.current;
    const probed = probeStoryRecorderMimeType(
      typeof MediaRecorder !== "undefined" ? MediaRecorder.isTypeSupported.bind(MediaRecorder) : undefined,
    );
    if (!stream || !probed) {
      setError(SOCIAL.stories.unavailable);
      return;
    }
    mimeRef.current = probed.mimeType;
    chunksRef.current = [];
    const live = liveRef.current;
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: probed.raw });
    } catch {
      try {
        recorder = new MediaRecorder(stream);
      } catch {
        setError(SOCIAL.stories.unavailable);
        return;
      }
    }
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      if (!storyStudioIsLive(liveRef.current, live)) return;
      const contentType = resolveStoryRecorderBlobType(
        chunksRef.current[0] instanceof Blob ? chunksRef.current[0].type : recorder.mimeType,
        mimeRef.current,
      );
      const blob = new Blob(chunksRef.current, { type: contentType });
      if (blob.size <= 0) {
        setError(SOCIAL.stories.mediaMissing);
        setPhase("preview");
        return;
      }
      const file = new File([blob], storyRecorderFileName(contentType), { type: contentType });
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
      const url = URL.createObjectURL(file);
      clipUrlRef.current = url;
      setClip({ file, url, contentType, kind: "video" });
      setPlaying(false);
      setPhase("review");
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    recordingRef.current = true;
    startClock();
    setPhase("recording");
  }

  function stopRecording() {
    clearHold();
    clearClock();
    recordingRef.current = false;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function onRecordPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (recordingRef.current) {
      stopRecording();
      return;
    }
    holdStartedRef.current = Date.now();
    startRecording();
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
    }, storyRecorderHoldMs());
  }

  function onRecordPointerUp() {
    const held = Date.now() - holdStartedRef.current;
    clearHold();
    if (recordingRef.current && held >= storyRecorderHoldMs()) {
      stopRecording();
    }
  }

  function closeStudio() {
    postRef.current = nextStoryStudioLive(postRef.current);
    setPosting(false);
    releasePreview();
    releaseClip();
    setPhase("video");
  }

  function retake() {
    if (posting) return;
    const image = clip?.kind === "image";
    postRef.current = nextStoryStudioLive(postRef.current);
    releaseClip();
    setError("");
    if (image) {
      setPhase("photo");
      return;
    }
    setPhase("preview");
    if (streamRef.current) return;
    const live = liveRef.current;
    void attachPreview(facing, live).catch(() => {
      if (!storyStudioIsLive(liveRef.current, live)) return;
      setError(SOCIAL.stories.permission);
      setPhase("video");
    });
  }

  function onPick(files: FileList | null, expected: SocialMediaKind, input: HTMLInputElement | null) {
    if (input) input.value = "";
    const file = files?.[0];
    if (!file) return;
    setError("");
    const kind = socialMediaKindFor(file.type);
    if (kind !== expected) {
      setError(expected === "image" ? SOCIAL.stories.photoMediaType : SOCIAL.stories.mediaType);
      return;
    }
    if (file.size <= 0) {
      setError(expected === "image" ? SOCIAL.stories.photoMissing : SOCIAL.stories.mediaMissing);
      return;
    }
    const max = expected === "image" ? SOCIAL_IMAGE_MAX_BYTES : SOCIAL_VIDEO_MAX_BYTES;
    if (file.size > max) {
      setError(SOCIAL.home.mediaTooLarge);
      return;
    }
    releasePreview();
    if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    const url = URL.createObjectURL(file);
    clipUrlRef.current = url;
    setClip({
      file,
      url,
      contentType: file.type as SocialMediaContentType,
      kind,
    });
    setPlaying(false);
    setPhase("review");
  }

  async function postClip() {
    if (!clip || posting) return;
    const postId = nextStoryStudioLive(postRef.current);
    postRef.current = postId;
    setError("");
    setPosting(true);
    const uploaded = await uploadStoryMedia(clip.file);
    if (!storyStudioIsLive(postRef.current, postId)) return;
    if (uploaded.error || !uploaded.item) {
      setPosting(false);
      setError(uploaded.error ?? SOCIAL.home.uploadFailed);
      return;
    }
    const form = new FormData();
    form.set("media", JSON.stringify([uploaded.item]));
    const result = await createSocialStory(form);
    if (!storyStudioIsLive(postRef.current, postId)) return;
    setPosting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    releasePreview();
    releaseClip();
    setPhase("posted");
  }

  const accept = SOCIAL_VIDEO_CONTENT_TYPES.join(",");
  const photoAccept = SOCIAL_IMAGE_CONTENT_TYPES.join(",");
  const videoStudio =
    phase === "preview" ||
    phase === "recording" ||
    (phase === "review" && clip?.kind === "video");

  return (
    <div data-social-story-compose="" className={videoStudio ? undefined : SOCIAL_STORY_CREATE_HOST_CLASS}>
      {videoStudio ? null : (
        <>
          <aside data-social-story-rail="" className={SOCIAL_STORY_CREATE_RAIL_CLASS}>
            <Link
              href={SOCIAL_ROUTES.home}
              data-social-story-close=""
              aria-label={SOCIAL.stories.close}
              className={SOCIAL_STORY_CREATE_CLOSE_CLASS}
            >
              <SocialIcon name="x" size={SOCIAL_ICON_SIZE_STORY_STUDIO} />
            </Link>
            <h2 className={SOCIAL_STORY_CREATE_TITLE_CLASS}>{SOCIAL.stories.yourStory}</h2>
            <div className={SOCIAL_STORY_CREATE_IDENTITY_CLASS}>
              <SocialAvatar name={displayName} photoUrl={photoUrl} size="sm" className="size-10" />
              <p className={SOCIAL_STORY_CREATE_NAME_CLASS}>{displayName}</p>
            </div>
          </aside>
          <div
            data-social-story-stage=""
            data-social-story-face={phase}
            className={SOCIAL_STORY_CREATE_STAGE_CLASS}
          >
            {phase === "stage" ? (
              <div className={SOCIAL_STORY_CREATE_CARDS_CLASS}>
                <button
                  type="button"
                  data-social-story-photo=""
                  className={SOCIAL_STORY_PHOTO_CARD_CLASS}
                  onClick={() => {
                    setError("");
                    setPhase("photo");
                  }}
                >
                  <span className={SOCIAL_STORY_CREATE_ICON_WELL_CLASS}>
                    <SocialIcon name="image" size={SOCIAL_ICON_SIZE_STORY_PICKER} />
                  </span>
                  <span className={SOCIAL_STORY_CREATE_LABEL_CLASS}>{SOCIAL.stories.photoCard}</span>
                </button>
                <button
                  type="button"
                  data-social-story-video=""
                  className={SOCIAL_STORY_VIDEO_CARD_CLASS}
                  onClick={() => {
                    setError("");
                    setPhase("video");
                  }}
                >
                  <span className={SOCIAL_STORY_CREATE_ICON_WELL_CLASS}>
                    <SocialIcon name="video-camera" size={SOCIAL_ICON_SIZE_STORY_PICKER} />
                  </span>
                  <span className={SOCIAL_STORY_CREATE_LABEL_CLASS}>{SOCIAL.stories.videoCard}</span>
                </button>
              </div>
            ) : null}

            {phase === "photo" ? (
              <div className={SOCIAL_STORY_CREATE_SECONDARY_CLASS}>
                <div className={SOCIAL_STORY_CREATE_SECONDARY_COLUMN_CLASS}>
                  <button
                    type="button"
                    data-social-story-back=""
                    className={SOCIAL_STORY_CREATE_BACK_CLASS}
                    onClick={() => {
                      setError("");
                      setPhase("stage");
                    }}
                  >
                    {SOCIAL.stories.back}
                  </button>
                  <h2 className="t-heading text-ink">{SOCIAL.stories.photoCard}</h2>
                  <button
                    type="button"
                    data-social-story-photo-library=""
                    className={SOCIAL_STORY_PICKER_ROW_CLASS}
                    onClick={() => photoLibraryRef.current?.click()}
                  >
                    <span className={SOCIAL_STORY_PICKER_WELL_CLASS}>
                      <SocialIcon name="image" size={SOCIAL_ICON_SIZE_STORY_PICKER} />
                    </span>
                    <span className="min-w-0">
                      <span className="block t-body font-semibold text-ink whitespace-normal break-words">
                        {SOCIAL.stories.photoLibrary}
                      </span>
                      <span className="block t-body-sm text-ink-2 whitespace-normal break-words">
                        {SOCIAL.stories.photoLibraryHint}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    data-social-story-photo-capture=""
                    className={SOCIAL_STORY_PICKER_ROW_CLASS}
                    onClick={() => photoCaptureRef.current?.click()}
                  >
                    <span className={SOCIAL_STORY_PICKER_WELL_CLASS}>
                      <SocialIcon name="camera" size={SOCIAL_ICON_SIZE_STORY_PICKER} />
                    </span>
                    <span className="min-w-0">
                      <span className="block t-body font-semibold text-ink whitespace-normal break-words">
                        {SOCIAL.stories.photoCapture}
                      </span>
                      <span className="block t-body-sm text-ink-2 whitespace-normal break-words">
                        {SOCIAL.stories.photoCaptureHint}
                      </span>
                    </span>
                  </button>
                  {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
                </div>
              </div>
            ) : null}

            {phase === "video" ? (
              <div className={SOCIAL_STORY_CREATE_SECONDARY_CLASS}>
                <div className={SOCIAL_STORY_CREATE_SECONDARY_COLUMN_CLASS}>
                  <button
                    type="button"
                    data-social-story-back=""
                    className={SOCIAL_STORY_CREATE_BACK_CLASS}
                    onClick={() => {
                      setError("");
                      setPhase("stage");
                    }}
                  >
                    {SOCIAL.stories.back}
                  </button>
                  <h2 className="t-heading text-ink">{SOCIAL.stories.videoCard}</h2>
                  <button
                    type="button"
                    data-social-story-record=""
                    className={SOCIAL_STORY_PICKER_ROW_CLASS}
                    onClick={() => void openStudio()}
                  >
                    <span className={SOCIAL_STORY_PICKER_WELL_CLASS}>
                      <SocialIcon name="video-camera" size={SOCIAL_ICON_SIZE_STORY_PICKER} />
                    </span>
                    <span className="min-w-0">
                      <span className="block t-body font-semibold text-ink whitespace-normal break-words">
                        {SOCIAL.stories.record}
                      </span>
                      <span className="block t-body-sm text-ink-2 whitespace-normal break-words">
                        {SOCIAL.stories.recordHint}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    data-social-story-upload=""
                    className={SOCIAL_STORY_PICKER_ROW_CLASS}
                    onClick={() => fileRef.current?.click()}
                  >
                    <span className={SOCIAL_STORY_PICKER_WELL_CLASS}>
                      <SocialIcon name="upload-simple" size={SOCIAL_ICON_SIZE_STORY_PICKER} />
                    </span>
                    <span className="min-w-0">
                      <span className="block t-body font-semibold text-ink whitespace-normal break-words">
                        {SOCIAL.stories.upload}
                      </span>
                      <span className="block t-body-sm text-ink-2 whitespace-normal break-words">
                        {SOCIAL.stories.uploadHint}
                      </span>
                    </span>
                  </button>
                  {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
                </div>
              </div>
            ) : null}

            {phase === "review" && clip?.kind === "image" ? (
              <div className={SOCIAL_STORY_CREATE_SECONDARY_CLASS}>
                <div className={SOCIAL_STORY_CREATE_SECONDARY_COLUMN_CLASS}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob before the story share */}
                  <img
                    data-social-story-photo-preview=""
                    src={clip.url}
                    alt={SOCIAL.stories.photoCard}
                    className={SOCIAL_STORY_SHARE_PREVIEW_CLASS}
                  />
                  <div className={SOCIAL_STORY_SHARE_ACTIONS_CLASS}>
                    <button
                      type="button"
                      data-social-story-retake=""
                      disabled={posting}
                      className={SOCIAL_STORY_SHARE_RETAKE_CLASS}
                      onClick={retake}
                    >
                      {SOCIAL.stories.retake}
                    </button>
                    <button
                      type="button"
                      data-social-story-post=""
                      disabled={posting}
                      className={SOCIAL_STORY_SHARE_POST_CLASS}
                      onClick={() => void postClip()}
                    >
                      {posting ? SOCIAL.stories.posting : SOCIAL.stories.post}
                    </button>
                  </div>
                  {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
                </div>
              </div>
            ) : null}

            {phase === "posted" ? (
              <div className="flex flex-1 items-center justify-center p-[var(--space-4)]">
                <div data-social-story-posted="" className={SOCIAL_STORY_POSTED_CLASS}>
                  <SocialIcon name="check-circle" size={SOCIAL_ICON_SIZE_STORY_POSTED} className="text-accent" />
                  <p className="t-title text-ink">{SOCIAL.stories.posted}</p>
                  <p className="t-body-sm text-ink-2 whitespace-normal break-words">{SOCIAL.stories.postedHint}</p>
                  <Link
                    href={SOCIAL_ROUTES.home}
                    className="inline-flex items-center justify-center rounded-full bg-accent px-[var(--space-6)] py-[var(--space-4)] t-body-sm font-semibold text-accent-contrast"
                  >
                    {SOCIAL.stories.viewStories}
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      {videoStudio ? (
        <div
          data-social-story-studio={phase}
          className={SOCIAL_STORY_STUDIO_CLASS}
        >
          <div className={SOCIAL_STORY_STUDIO_STAGE_CLASS}>
            {phase === "review" && clip ? (
              <video
                ref={reviewRef}
                data-social-story-video=""
                src={clip.url}
                playsInline
                className={SOCIAL_STORY_STUDIO_REVIEW_CLASS}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
              />
            ) : (
              <video
                ref={videoRef}
                data-social-story-preview=""
                data-social-story-preview-facing={facing}
                autoPlay
                muted
                playsInline
                className={socialStoryStudioPreviewClass(storyStudioMirrorsPreview(facing))}
              />
            )}
            {phase !== "review" ? <div className={SOCIAL_STORY_STUDIO_RING_CLASS} aria-hidden /> : null}

            <div className={SOCIAL_STORY_STUDIO_CHROME_CLASS}>
              <button
                type="button"
                aria-label={SOCIAL.stories.close}
                className={SOCIAL_STORY_STUDIO_ICON_CLASS}
                disabled={posting}
                onClick={closeStudio}
              >
                <SocialIcon name="x" size={SOCIAL_ICON_SIZE_STORY_STUDIO} />
              </button>
              <p className="t-body-sm font-semibold text-band-ink">
                {phase === "recording" ? clock : phase === "review" ? SOCIAL.stories.review : SOCIAL.stories.studioTitle}
              </p>
              {phase === "review" ? (
                <span className="size-10" />
              ) : (
                <button
                  type="button"
                  aria-label={SOCIAL.stories.flipCamera}
                  className={SOCIAL_STORY_STUDIO_ICON_CLASS}
                  disabled={phase === "recording"}
                  onClick={() => void flipCamera()}
                >
                  <SocialIcon name="camera-rotate" size={SOCIAL_ICON_SIZE_STORY_STUDIO} />
                </button>
              )}
            </div>

            {phase === "recording" ? (
              <div data-social-story-rec="" className={SOCIAL_STORY_REC_PILL_CLASS}>
                <span className="size-1.5 rounded-full bg-accent-contrast" />
                {SOCIAL.stories.rec}
              </div>
            ) : null}

            {phase === "review" && !playing ? (
              <button
                type="button"
                data-social-story-play=""
                aria-label={SOCIAL.stories.play}
                className="absolute left-1/2 top-1/2 z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-band-ink/20 text-band-ink"
                onClick={() => void reviewRef.current?.play()}
              >
                <SocialIcon name="play" size={SOCIAL_ICON_SIZE_STORY_PLAY} />
              </button>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-center gap-4 bg-gradient-to-t from-band/80 to-transparent px-6 pb-10 pt-6">
              {phase === "review" ? (
                <>
                  <p className="t-label text-band-ink/50">{SOCIAL.stories.trimLater}</p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      data-social-story-retake=""
                      disabled={posting}
                      className="inline-flex items-center justify-center rounded-full border border-band-ink/35 bg-band-ink/12 px-6 py-3.5 t-body-sm font-semibold text-band-ink"
                      onClick={retake}
                    >
                      {SOCIAL.stories.retake}
                    </button>
                    <button
                      type="button"
                      data-social-story-post=""
                      disabled={posting}
                      className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 t-body-sm font-semibold text-accent-contrast"
                      onClick={() => void postClip()}
                    >
                      {posting ? SOCIAL.stories.posting : SOCIAL.stories.post}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="t-body-sm text-band-ink/85">
                    {phase === "recording" ? SOCIAL.stories.recording : SOCIAL.stories.holdOrTap}
                  </p>
                  <button
                    type="button"
                    data-social-story-shutter=""
                    aria-label={phase === "recording" ? SOCIAL.stories.recording : SOCIAL.stories.holdOrTap}
                    className={SOCIAL_STORY_RECORD_CLASS}
                    onPointerDown={onRecordPointerDown}
                    onPointerUp={onRecordPointerUp}
                    onPointerCancel={onRecordPointerUp}
                  >
                    {phase === "recording" ? <span className={SOCIAL_STORY_STOP_CLASS} /> : null}
                  </button>
                  {phase === "preview" ? (
                    <button
                      type="button"
                      className="t-label text-band-ink/55"
                      onClick={() => fileRef.current?.click()}
                    >
                      {SOCIAL.stories.uploadFromRoll}
                    </button>
                  ) : null}
                </>
              )}
              {error ? <p className="t-body-sm text-band-ink">{error}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {phase === "video" || videoStudio ? (
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="sr-only"
          aria-label={SOCIAL.stories.upload}
          onChange={(e) => onPick(e.target.files, "video", fileRef.current)}
        />
      ) : null}
      {phase === "photo" || (phase === "review" && clip?.kind === "image") ? (
        <>
          <input
            ref={photoLibraryRef}
            type="file"
            accept={photoAccept}
            className="sr-only"
            aria-label={SOCIAL.stories.photoLibrary}
            onChange={(e) => onPick(e.target.files, "image", photoLibraryRef.current)}
          />
          <input
            ref={photoCaptureRef}
            type="file"
            accept={photoAccept}
            capture="environment"
            className="sr-only"
            aria-label={SOCIAL.stories.photoCapture}
            onChange={(e) => onPick(e.target.files, "image", photoCaptureRef.current)}
          />
        </>
      ) : null}
    </div>
  );
}
