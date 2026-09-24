import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SOCIAL_VIDEO_CONTENT_TYPES } from "./social-media";
import {
  captureStoryStillFrame,
  formatStoryRecorderClock,
  probeStoryRecorderMimeType,
  resolveStoryRecorderBlobType,
  SOCIAL_STORY_RECORDER_CANDIDATES,
  storyRecorderContentType,
  cloneStoryUploadFile,
  storyRecorderFileName,
  storyRecorderHoldMs,
  bindStoryReviewVideo,
  storyRecorderStopFlushMs,
  storyRecorderTimesliceMs,
  setStoryCameraTorch,
  storyCameraSupportsTorch,
  storyReviewArmMs,
  storyReviewFrameSeconds,
  storyReviewMediaSrc,
  prepareStoryUploadFile,
  storyUploadContentType,
  storyUploadNotice,
  storyStoreNotice,
  storyPutBlockedByCors,
  storyVideoInputCount,
  nextStoryStudioLive,
  storyRecorderVideoConstraints,
  storyStudioIsLive,
  storyStudioMirrorsPreview,
} from "./social-story-recorder";

describe("story MediaRecorder mime probe", () => {
  it("prefers a house-allowlisted type the browser actually supports", () => {
    const safari = probeStoryRecorderMimeType((type) => type.startsWith("video/mp4"));
    expect(safari).toEqual({
      mimeType: "video/mp4",
      raw: "video/mp4;codecs=avc1.424028,mp4a.40.2",
    });

    const chrome = probeStoryRecorderMimeType((type) => type.startsWith("video/webm"));
    expect(chrome).toEqual({
      mimeType: "video/webm",
      raw: "video/webm;codecs=vp9,opus",
    });

    const none = probeStoryRecorderMimeType(() => false);
    expect(none).toBeNull();
    expect(probeStoryRecorderMimeType(undefined)).toBeNull();
  });

  it("never promotes an unsupported container to mp4", () => {
    const webmOnly = probeStoryRecorderMimeType((type) => type === "video/webm");
    expect(webmOnly?.mimeType).toBe("video/webm");
    expect(webmOnly?.raw).toBe("video/webm");
    expect(resolveStoryRecorderBlobType("video/webm;codecs=vp8,opus", "video/mp4")).toBe(
      "video/webm",
    );
    expect(resolveStoryRecorderBlobType("", "video/mp4")).toBe("video/mp4");
    expect(resolveStoryRecorderBlobType("video/ogg", "video/webm")).toBe("video/webm");
  });

  it("maps house types only and keeps the recorder allowlist on SOCIAL_VIDEO", () => {
    expect(storyRecorderContentType("video/mp4;codecs=avc1")).toBe("video/mp4");
    expect(storyRecorderContentType("video/quicktime")).toBe("video/quicktime");
    expect(storyRecorderContentType("video/webm")).toBe("video/webm");
    expect(storyRecorderContentType("image/jpeg")).toBeNull();
    expect(storyRecorderContentType("video/x-matroska")).toBeNull();
    expect(SOCIAL_STORY_RECORDER_CANDIDATES.every((raw) => {
      const type = storyRecorderContentType(raw);
      return type && (SOCIAL_VIDEO_CONTENT_TYPES as readonly string[]).includes(type);
    })).toBe(true);
    expect(storyRecorderFileName("video/mp4")).toBe("story.mp4");
    expect(storyRecorderFileName("video/quicktime")).toBe("story.mov");
    expect(storyRecorderFileName("video/webm")).toBe("story.webm");
  });

  it("formats a clock without inventing a duration cap", () => {
    expect(formatStoryRecorderClock(0)).toBe("0:00");
    expect(formatStoryRecorderClock(4000)).toBe("0:04");
    expect(formatStoryRecorderClock(72_000)).toBe("1:12");
    expect(storyRecorderHoldMs()).toBeLessThan(1000);
    expect(JSON.stringify({ SOCIAL_STORY_RECORDER_CANDIDATES })).not.toMatch(/15/);
  });

  it("mirrors front-camera preview only and does not crop the capture stream", () => {
    expect(storyStudioMirrorsPreview("user")).toBe(true);
    expect(storyStudioMirrorsPreview("environment")).toBe(false);
    expect(storyRecorderVideoConstraints("user")).toEqual({
      facingMode: { ideal: "user" },
    });
    expect(storyRecorderVideoConstraints("environment")).toEqual({
      facingMode: { ideal: "environment" },
    });
    expect(JSON.stringify(storyRecorderVideoConstraints("user"))).not.toMatch(/720|1280/);
    expect(JSON.stringify(storyRecorderVideoConstraints("environment"))).not.toMatch(
      /width|height|aspectRatio/,
    );
  });

  it("seals one playable blob and a detached upload body for WebKit", async () => {
    expect(storyRecorderTimesliceMs()).toBeNull();
    expect(storyRecorderStopFlushMs()).toBe(250);
    expect(storyReviewFrameSeconds()).toBeGreaterThan(0);
    expect(storyReviewFrameSeconds()).toBeLessThan(1);
    expect(storyReviewMediaSrc("blob:https://24frame.local/clip")).toBe(
      "blob:https://24frame.local/clip",
    );
    expect(storyReviewMediaSrc("blob:https://24frame.local/clip#t=0.001")).toBe(
      "blob:https://24frame.local/clip",
    );
    expect(storyReviewArmMs()).toBeGreaterThan(0);
    const source = new File([new Uint8Array([9, 8, 7, 6])], "story.mp4", { type: "video/mp4" });
    const copy = await cloneStoryUploadFile(source);
    expect(copy).not.toBe(source);
    expect(copy.type).toBe("video/mp4");
    expect(copy.size).toBe(4);
    expect(new Uint8Array(await copy.arrayBuffer())).toEqual(new Uint8Array([9, 8, 7, 6]));
    const studio = readFileSync("src/components/social/social-story-studio.tsx", "utf8");
    expect(studio).toContain("storyRecorderTimesliceMs()");
    expect(studio).not.toContain("recorder.start(1000)");
    expect(studio).toContain("cloneStoryUploadFile");
    expect(studio).toContain("storyRecorderStopFlushMs()");
    expect(studio).toContain("stopStream(streamRef.current)");
    expect(studio).toContain("releaseLiveCamera()");
    expect(studio).not.toContain("AbortSignal.timeout");
    expect(studio).not.toContain("signal:");
    const uploadStart = studio.indexOf("async function uploadStoryMedia");
    const uploadEnd = studio.indexOf("export function SocialStoryCompose");
    const uploadBlock = studio.slice(uploadStart, uploadEnd);
    expect(uploadBlock).toContain('headers: { "Content-Type": signed.contentType }');
    expect(uploadBlock).toContain('console.error("story-put", put.status, put.statusText, await put.text())');
    expect(uploadBlock).toMatch(/body: prepared,\s*signal,/);
    expect(uploadBlock).toContain("if (signal?.aborted) return {}");
    expect(uploadBlock).not.toContain("AbortSignal.timeout");
    expect(uploadBlock).toContain('storyStoreNotice("presign")');
    expect(uploadBlock).toContain('storyStoreNotice("reject")');
    expect(uploadBlock).toContain('storyStoreNotice("network")');
    expect(studio).toContain('body.set("lane", "stories")');
    expect(studio).toContain('body.set("byte_length", String(prepared.size))');
    expect(studio).toContain("if (signed.error) return { error: signed.error }");
    expect(readFileSync("src/lib/social-story-recorder.ts", "utf8")).not.toContain("AbortSignal.timeout");
    expect(studio).toContain('key="story-review"');
    expect(studio).toContain('key="story-live"');
    expect(studio).toContain("onClick={playReview}");
    const playStart = studio.indexOf("function playReview");
    const playEnd = studio.indexOf("async function postClip");
    const playBlock = studio.slice(playStart, playEnd);
    expect(playBlock).toContain("bindStoryReviewVideo");
    expect(playBlock.indexOf("postingRef.current")).toBeLessThan(playBlock.indexOf("bindStoryReviewVideo"));
    expect(playBlock).toContain("storyReviewMediaSrc");
    expect(playBlock).toContain("node.play().catch(() => undefined)");
    expect(playBlock.slice(playBlock.indexOf(".catch("))).not.toContain("mediaMissing");
    const playButton = studio.slice(studio.indexOf('data-social-story-play=""'));
    expect(playButton.slice(0, 400)).toContain("disabled={posting}");
    expect(playBlock).not.toContain("attachPreview");
    expect(playBlock).not.toContain("getUserMedia");
    expect(playBlock).not.toContain('setPhase("preview")');
    const retakeStart = studio.indexOf("function retake");
    const retakeEnd = studio.indexOf("function onPick");
    expect(studio.slice(retakeStart, retakeEnd)).toContain("storyReviewArmMs()");
    const postStart = studio.indexOf("async function postClip");
    const postEnd = studio.indexOf("const accept = ");
    const postBlock = studio.slice(postStart, postEnd);
    expect(postBlock.indexOf("clip.file.size")).toBeLessThan(postBlock.indexOf("setPosting(true)"));
    expect(postBlock).toContain("SOCIAL.stories.mediaMissing");
    expect(postBlock).toContain('storyUploadNotice("read")');
    expect(postBlock).toContain('storyUploadNotice("missing", clip.kind)');
    expect(postBlock).toContain("postingRef.current = true");
    expect(postBlock.indexOf("if (posting || postingRef.current) return")).toBeLessThan(
      postBlock.indexOf("postingRef.current = true"),
    );
    expect(postBlock).toContain("new AbortController()");
    expect(postBlock).toContain("uploadAbort.signal");
    expect(postBlock).toContain("uploadAbort.signal.aborted");
    expect(postBlock).toContain("setError(result.error)");
    const closeStart = studio.indexOf("function closeStudio");
    const closeEnd = studio.indexOf("async function openPhotoCamera");
    const closeBlock = studio.slice(closeStart, closeEnd);
    expect(closeBlock.indexOf("nextStoryStudioLive(postRef.current)")).toBeLessThan(
      closeBlock.indexOf("uploadAbortRef.current?.abort()"),
    );
    expect(closeBlock).toContain("postingRef.current = false");
    const unmount = studio.slice(studio.indexOf("useEffect(() => {"), studio.indexOf("}, []);"));
    expect(unmount).toContain("postRef.current = nextStoryStudioLive(postRef.current)");
    expect(unmount).toContain("uploadAbortRef.current?.abort()");
    const start = studio.indexOf("function startRecording");
    const startEnd = studio.indexOf("function releaseLiveCamera");
    const startBlock = studio.slice(start, startEnd);
    expect(startBlock.indexOf("nextStoryStudioLive(liveRef.current)")).toBeLessThan(
      startBlock.indexOf("chunksRef.current = []"),
    );
    const sealStart = studio.indexOf("function sealRecording");
    const sealEnd = studio.indexOf("function stopRecording");
    const sealBlock = studio.slice(sealStart, sealEnd);
    expect(sealBlock.indexOf("releaseLiveCamera()")).toBeLessThan(sealBlock.lastIndexOf('setPhase("review")'));
    expect(sealBlock).toContain("reviewArmRef.current = Date.now()");
    expect(sealBlock).not.toContain('setPhase("preview")');
    const pickStart = studio.indexOf("function onPick");
    const pickEnd = studio.indexOf("function restoreReviewPlayback");
    const pickBlock = studio.slice(pickStart, pickEnd);
    expect(pickBlock).toContain("reviewArmRef.current = 0");
    expect(pickBlock).not.toContain("reviewArmRef.current = Date.now()");
    expect(pickBlock.indexOf("setStillMode(false)")).toBeGreaterThan(pickBlock.indexOf("releasePreview()"));
  });

  it("keeps the story upload type exact and splits store errors", async () => {
    expect(storyUploadContentType("video/mp4")).toBe("video/mp4");
    expect(storyUploadContentType("video/webm")).toBe("video/webm");
    expect(storyUploadContentType("video/quicktime")).toBe("video/quicktime");
    expect(storyUploadContentType("video/mp4;codecs=avc1.42E01E,mp4a.40.2")).toBe("video/mp4");
    expect(storyUploadContentType("video/ogg")).toBeNull();
    expect(storyUploadContentType("image/jpeg")).toBe("image/jpeg");
    expect(storyUploadContentType("image/png")).toBe("image/png");
    expect(storyUploadContentType("image/webp")).toBe("image/webp");
    expect(storyUploadContentType("image/gif")).toBe("image/gif");
    const exact = new File([new Uint8Array([1, 2, 3])], "story.mp4", { type: "video/mp4" });
    const kept = prepareStoryUploadFile(exact);
    expect(kept).toBe(exact);
    const jpeg = new File([new Uint8Array([9, 9])], "story.jpg", { type: "image/jpeg" });
    expect(prepareStoryUploadFile(jpeg)).toBe(jpeg);
    const suffixed = new File([new Uint8Array([4, 5])], "clip.mp4", {
      type: "video/mp4;codecs=avc1",
    });
    const normalized = prepareStoryUploadFile(suffixed);
    expect(normalized).not.toBe("type");
    if (normalized instanceof File) {
      expect(normalized.type).toBe("video/mp4");
      expect(normalized.size).toBe(suffixed.size);
    }
    expect(prepareStoryUploadFile(new File([], "empty.mp4", { type: "video/mp4" }))).toBe("missing");
    expect(prepareStoryUploadFile(new File([new Uint8Array([1])], "notes.txt", { type: "text/plain" }))).toBe(
      "type",
    );
    expect(storyUploadNotice("missing")).toBe("Choose a video first.");
    expect(storyUploadNotice("missing", "image")).toBe("Choose a photo first.");
    expect(storyUploadNotice("type")).toBe("Use a video (MP4, QuickTime, WebM).");
    expect(storyUploadNotice("type", "image")).toBe("Use a photo (JPEG, PNG, WebP, GIF).");
    expect(storyUploadNotice("read")).toBe("That file cannot be attached.");
    expect(storyUploadNotice("store")).toBe("The file could not be stored.");
    expect(storyUploadNotice("store")).not.toBe(storyUploadNotice("read"));
    expect(storyUploadNotice("store")).not.toBe(storyUploadNotice("missing"));
    expect(storyStoreNotice("presign")).toBe("Those attachments could not be stored.");
    expect(storyStoreNotice("presign")).not.toBe(storyStoreNotice("network"));
    expect(storyStoreNotice("reject")).toBe(storyStoreNotice("network"));
    expect(storyStoreNotice("network")).toBe("The file could not be stored.");
    expect(storyStoreNotice("network")).not.toBe(storyUploadNotice("missing"));
    expect(storyPutBlockedByCors({ status: 403, allowOrigin: null })).toBe(true);
    expect(
      storyPutBlockedByCors({ status: 200, allowOrigin: "http://localhost:3000" }),
    ).toBe(false);
    const recorded = new File([new Uint8Array([1, 2, 3, 4])], "story.mp4", {
      type: "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    });
    const cloned = await cloneStoryUploadFile(recorded);
    expect(cloned.size).toBe(recorded.size);
    const preparedClip = prepareStoryUploadFile(cloned);
    expect(preparedClip).not.toBe("missing");
    expect(preparedClip).not.toBe("type");
    if (preparedClip instanceof File) {
      expect(preparedClip.size).toBe(4);
      expect(preparedClip.type).toBe("video/mp4");
    }
  });

  it("shows flash only when the track can torch, and counts cameras", async () => {
    expect(storyCameraSupportsTorch(null)).toBe(false);
    expect(storyCameraSupportsTorch({})).toBe(false);
    expect(storyCameraSupportsTorch({ getCapabilities: () => ({}) })).toBe(false);
    expect(storyCameraSupportsTorch({ getCapabilities: () => ({ torch: false }) })).toBe(false);
    expect(
      storyCameraSupportsTorch({
        getCapabilities: () => {
          throw new Error("unsupported");
        },
      }),
    ).toBe(false);
    const capable = { getCapabilities: () => ({ torch: true }) };
    expect(storyCameraSupportsTorch(capable)).toBe(true);
    expect(await setStoryCameraTorch(capable, true)).toBe(false);
    let lit = false;
    expect(
      await setStoryCameraTorch(
        {
          getCapabilities: () => ({ torch: true }),
          applyConstraints: async () => {
            lit = true;
          },
        },
        true,
      ),
    ).toBe(true);
    expect(lit).toBe(true);
    expect(storyVideoInputCount([{ kind: "audioinput" }])).toBe(0);
    expect(storyVideoInputCount([{ kind: "videoinput" }])).toBe(1);
    expect(
      storyVideoInputCount([{ kind: "videoinput" }, { kind: "videoinput" }, { kind: "audioinput" }]),
    ).toBe(2);
  });

  it("binds the recorded blob and clears the live camera provider", () => {
    const node = {
      srcObject: { kind: "camera" } as unknown,
      src: "about:blank",
      muted: false,
      playsInline: false,
      preload: "none",
      loads: 0,
      load() {
        this.loads += 1;
      },
    };
    bindStoryReviewVideo(node, "blob:https://24frame.local/clip#t=0.001");
    expect(node.srcObject).toBeNull();
    expect(node.src).toBe("blob:https://24frame.local/clip");
    expect(node.loads).toBe(1);
    expect(node.muted).toBe(true);
    expect(node.playsInline).toBe(true);
    expect(node.preload).toBe("auto");
    bindStoryReviewVideo(node, "blob:https://24frame.local/clip");
    expect(node.loads).toBe(1);
    const painted = {
      srcObject: null as unknown,
      src: "blob:https://24frame.local/clip",
      muted: true,
      playsInline: true,
      preload: "auto",
      loads: 0,
      load() {
        this.loads += 1;
      },
    };
    bindStoryReviewVideo(painted, "blob:https://24frame.local/clip");
    expect(painted.loads).toBe(0);
    expect(painted.srcObject).toBeNull();
    bindStoryReviewVideo(null, "blob:https://24frame.local/clip");
    bindStoryReviewVideo(node, "");
    expect(node.loads).toBe(1);
  });

  it("captures a jpeg still from the live preview frame", async () => {
    let drew = false;
    const file = await captureStoryStillFrame(
      { videoWidth: 2, videoHeight: 3 },
      {
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: () => {
            drew = true;
          },
        }),
        toBlob: (callback) => callback(new Blob([new Uint8Array([1, 2])], { type: "image/jpeg" })),
      },
    );
    expect(drew).toBe(true);
    expect(file?.type).toBe("image/jpeg");
    expect(file?.name).toBe("story.jpg");
    expect(file?.size).toBe(2);
    expect(
      await captureStoryStillFrame(
        { videoWidth: 0, videoHeight: 10 },
        {
          width: 0,
          height: 0,
          getContext: () => {
            throw new Error("no canvas");
          },
          toBlob: () => undefined,
        },
      ),
    ).toBeNull();
  });

  it("invalidates in-flight studio work after teardown or cancel", () => {
    const opened = nextStoryStudioLive(0);
    expect(storyStudioIsLive(opened, opened)).toBe(true);
    const closed = nextStoryStudioLive(opened);
    expect(storyStudioIsLive(closed, opened)).toBe(false);
    expect(storyStudioIsLive(closed, closed)).toBe(true);
  });
});
