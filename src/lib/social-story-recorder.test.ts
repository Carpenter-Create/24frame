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
  storyReviewArmMs,
  storyReviewFrameSeconds,
  storyReviewMediaSrc,
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
    expect(storyRecorderStopFlushMs()).toBeGreaterThan(0);
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
    expect(studio).toContain('key="story-review"');
    expect(studio).toContain('key="story-live"');
    expect(studio).toContain("onClick={playReview}");
    const playStart = studio.indexOf("function playReview");
    const playEnd = studio.indexOf("async function postClip");
    const playBlock = studio.slice(playStart, playEnd);
    expect(playBlock).toContain("bindStoryReviewVideo");
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
    const sealStart = studio.indexOf("function sealRecording");
    const sealEnd = studio.indexOf("function stopRecording");
    expect(studio.slice(sealStart, sealEnd)).not.toContain('setPhase("preview")');
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
