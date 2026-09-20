"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { HouseVoiceMic } from "@/components/chrome/house-voice-mic";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Textarea } from "@/components/ui/textarea";
import {
  createSocialPost,
  presignSocialMediaUpload,
} from "@/app/(app)/social/actions";
import { HOUSE_VOICE_FIELD_HOST_CLASS } from "@/lib/form-control";
import {
  SOCIAL_ACTION_CLASS,
  SOCIAL_ACTION_SECONDARY_CLASS,
  SOCIAL_STORY_REC_PILL_CLASS,
  SOCIAL_STORY_RECORD_CLASS,
  SOCIAL_STORY_STOP_CLASS,
  SOCIAL_STORY_STUDIO_CHROME_CLASS,
  SOCIAL_STORY_STUDIO_CLASS,
  SOCIAL_STORY_STUDIO_ICON_CLASS,
  SOCIAL_STORY_STUDIO_REVIEW_CLASS,
  SOCIAL_STORY_STUDIO_STAGE_CLASS,
  socialStoryStudioPreviewClass,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_STORY_STUDIO } from "@/lib/social-icons";
import {
  SOCIAL_VIDEO_MAX_BYTES,
  type SocialMediaItem,
  type SocialVideoContentType,
} from "@/lib/social-media";
import {
  formatGoLiveClock,
  goLiveFileName,
  goLiveFitsByteCap,
  goLiveReachedCap,
  goLiveRecorderOptions,
  goLiveRemainingMs,
  SOCIAL_GO_LIVE_MAX_MS,
} from "@/lib/social-go-live";
import { SOCIAL, SOCIAL_ROUTES, socialCreateHref } from "@/lib/social";
import {
  ingestSpeechLearning,
} from "@/lib/speech-learning";
import {
  nextStoryStudioLive,
  probeStoryRecorderMimeType,
  resolveStoryRecorderBlobType,
  storyRecorderVideoConstraints,
  storyStudioIsLive,
  storyStudioMirrorsPreview,
  type StoryStudioFacing,
} from "@/lib/social-story-recorder";
import { SocialIcon } from "./social-icon";

type LivePhase = "preview" | "recording" | "review";

type ReviewClip = {
  file: File;
  url: string;
  contentType: SocialVideoContentType;
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function uploadLiveVideo(file: File): Promise<{ item?: SocialMediaItem; error?: string }> {
  const body = new FormData();
  body.set("content_type", file.type);
  body.set("byte_length", String(file.size));
  body.set("lane", "posts");
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
  return {
    item: {
      kind: "video",
      key: signed.key,
      contentType: signed.contentType as SocialVideoContentType,
    },
  };
}

export function SocialGoLive() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const clockStartedRef = useRef(0);
  const clockTimerRef = useRef<number | null>(null);
  const mimeRef = useRef<SocialVideoContentType>("video/webm");
  const recordingRef = useRef(false);
  const clipUrlRef = useRef<string | null>(null);
  const liveRef = useRef(0);

  const [phase, setPhase] = useState<LivePhase>("preview");
  const [facing, setFacing] = useState<StoryStudioFacing>("user");
  const [error, setError] = useState("");
  const [clock, setClock] = useState(formatGoLiveClock(SOCIAL_GO_LIVE_MAX_MS));
  const [clip, setClip] = useState<ReviewClip | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  function clearClock() {
    if (clockTimerRef.current != null) {
      window.clearInterval(clockTimerRef.current);
      clockTimerRef.current = null;
    }
    setClock(formatGoLiveClock(SOCIAL_GO_LIVE_MAX_MS));
  }

  function releasePreview() {
    liveRef.current = nextStoryStudioLive(liveRef.current);
    recordingRef.current = false;
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
  }

  useEffect(() => {
    return () => {
      releasePreview();
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    };
    // Unmount-only teardown.
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

  useEffect(() => {
    let cancelled = false;
    const live = nextStoryStudioLive(liveRef.current);
    liveRef.current = live;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      const probed = probeStoryRecorderMimeType(
        typeof MediaRecorder !== "undefined" ? MediaRecorder.isTypeSupported.bind(MediaRecorder) : undefined,
      );
      if (!probed || typeof MediaRecorder === "undefined") {
        setError(SOCIAL.stories.unavailable);
        return;
      }
      mimeRef.current = probed.mimeType;
      try {
        await attachPreview(facing, live);
      } catch {
        if (!storyStudioIsLive(liveRef.current, live) || cancelled) return;
        releasePreview();
        setError(SOCIAL.stories.permission);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Open camera once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setClock(formatGoLiveClock(SOCIAL_GO_LIVE_MAX_MS));
    clockTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - clockStartedRef.current;
      setClock(formatGoLiveClock(goLiveRemainingMs(elapsed)));
      if (goLiveReachedCap(elapsed) && recordingRef.current) {
        stopRecording();
      }
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
      recorder = new MediaRecorder(stream, goLiveRecorderOptions(probed.raw));
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
      const file = new File([blob], goLiveFileName(contentType), { type: contentType });
      if (!goLiveFitsByteCap(file.size, SOCIAL_VIDEO_MAX_BYTES)) {
        setError(SOCIAL.home.mediaTooLarge);
        setPhase("preview");
        return;
      }
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
      const url = URL.createObjectURL(file);
      clipUrlRef.current = url;
      setClip({ file, url, contentType });
      setPhase("review");
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    recordingRef.current = true;
    startClock();
    setPhase("recording");
  }

  function stopRecording() {
    clearClock();
    recordingRef.current = false;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function retake() {
    if (posting) return;
    releaseClip();
    setError("");
    setPhase("preview");
    if (streamRef.current) return;
    const live = liveRef.current;
    void attachPreview(facing, live).catch(() => {
      if (!storyStudioIsLive(liveRef.current, live)) return;
      setError(SOCIAL.stories.permission);
    });
  }

  async function postClip() {
    if (!clip || posting) return;
    setError("");
    setPosting(true);
    const uploaded = await uploadLiveVideo(clip.file);
    if (uploaded.error || !uploaded.item) {
      setPosting(false);
      setError(uploaded.error ?? SOCIAL.home.uploadFailed);
      return;
    }
    const form = new FormData();
    form.set("body", body);
    form.set("media", JSON.stringify([uploaded.item]));
    ingestSpeechLearning({
      text: body,
      source: "typed",
      workspace: "social",
    });
    const result = await createSocialPost(form);
    if (result?.error) {
      setPosting(false);
      setError(result.error);
    }
  }

  const mirrored = storyStudioMirrorsPreview(facing);

  return (
    <div data-social-go-live="" className={SOCIAL_STORY_STUDIO_CLASS}>
      <div data-social-go-live-stage="" className={SOCIAL_STORY_STUDIO_STAGE_CLASS}>
        {phase === "review" && clip ? (
          <video
            src={clip.url}
            className={SOCIAL_STORY_STUDIO_REVIEW_CLASS}
            playsInline
            controls
          />
        ) : (
          <video
            ref={videoRef}
            className={socialStoryStudioPreviewClass(mirrored)}
            muted
            playsInline
            autoPlay
          />
        )}
        <div className={SOCIAL_STORY_STUDIO_CHROME_CLASS}>
          <Link
            href={SOCIAL_ROUTES.create}
            aria-label={SOCIAL.stories.close}
            className={SOCIAL_STORY_STUDIO_ICON_CLASS}
          >
            <SocialIcon name="x" size={SOCIAL_ICON_SIZE_STORY_STUDIO} />
          </Link>
          <span className="t-label font-semibold text-band-ink">{SOCIAL.create.goLive}</span>
          <button
            type="button"
            aria-label={SOCIAL.stories.flipCamera}
            className={SOCIAL_STORY_STUDIO_ICON_CLASS}
            disabled={phase !== "preview"}
            onClick={() => void flipCamera()}
          >
            <SocialIcon name="camera-rotate" size={SOCIAL_ICON_SIZE_STORY_STUDIO} />
          </button>
        </div>
        {phase === "recording" ? (
          <p data-social-go-live-timer="" className={SOCIAL_STORY_REC_PILL_CLASS}>
            {SOCIAL.stories.rec} {clock}
          </p>
        ) : null}
        {phase === "preview" || phase === "recording" ? (
          <div className="absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-3">
            <p className="t-label text-band-ink/80">{SOCIAL.create.liveHint}</p>
            <button
              type="button"
              data-social-go-live-record=""
              aria-label={phase === "recording" ? SOCIAL.create.liveStop : SOCIAL.create.liveStart}
              className={SOCIAL_STORY_RECORD_CLASS}
              onClick={() => {
                if (recordingRef.current) stopRecording();
                else startRecording();
              }}
            >
              {phase === "recording" ? <span className={SOCIAL_STORY_STOP_CLASS} /> : null}
            </button>
          </div>
        ) : null}
        {phase === "review" ? (
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 bg-band/55 p-4">
            <div data-social-go-live-caption="" className={HOUSE_VOICE_FIELD_HOST_CLASS}>
              <Textarea
                variant="bare"
                id="social-go-live-body"
                rows={2}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={SOCIAL.home.captionPlaceholder}
                className="min-h-[3rem] flex-1"
              />
              <HouseVoiceMic
                surface="dictate"
                workspace="social"
                getValue={() => body}
                onValue={setBody}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                className={SOCIAL_ACTION_SECONDARY_CLASS}
                disabled={posting}
                onClick={retake}
              >
                {SOCIAL.create.liveRetake}
              </button>
              <button
                type="button"
                data-social-go-live-post=""
                className={SOCIAL_ACTION_CLASS}
                disabled={posting}
                onClick={() => void postClip()}
              >
                {posting ? SOCIAL.stories.posting : SOCIAL.create.livePost}
              </button>
            </div>
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-x-4 top-16 z-20">
            <InlineNotice tone="error">
              {error}{" "}
              <Link href={socialCreateHref("video")} className="underline">
                {SOCIAL.create.liveUseVideo}
              </Link>
            </InlineNotice>
          </div>
        ) : null}
      </div>
    </div>
  );
}
