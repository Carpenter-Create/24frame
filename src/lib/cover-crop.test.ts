import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  clampRectCropOffset,
  defaultRectCropFrame,
  rectCoverDrawSize,
  rectCropSourceRect,
} from "./account-avatar-crop";
import {
  COVER_CROP_MAX_BYTES,
  COVER_CROP_OUTPUT_HEIGHT,
  COVER_CROP_OUTPUT_NAME,
  COVER_CROP_OUTPUT_WIDTH,
  COVER_CROP_VIEW_HEIGHT,
  COVER_CROP_VIEW_WIDTH,
  SOCIAL_PROFILE_COVER_LOCK_A,
} from "./social-profile-cover";
import { SOCIAL } from "./social";

describe("rectangular cover crop math", () => {
  it("cover-fits a landscape image into the 4:1 viewport", () => {
    const draw = rectCoverDrawSize(2000, 1000, 320, 80, 1);
    expect(draw.width).toBe(320);
    expect(draw.height).toBe(160);
  });

  it("cover-fits a portrait image into the 4:1 viewport", () => {
    const draw = rectCoverDrawSize(500, 1000, 320, 80, 1);
    expect(draw.width).toBe(320);
    expect(draw.height).toBe(640);
  });

  it("scales by the zoom factor", () => {
    const draw = rectCoverDrawSize(2000, 1000, 320, 80, 2);
    expect(draw.width).toBe(640);
    expect(draw.height).toBe(320);
  });

  it("clamps pan within the rectangular viewport", () => {
    const draw = rectCoverDrawSize(2000, 1000, 320, 80, 1);
    expect(clampRectCropOffset(0, 0, draw.width, draw.height, 320, 80)).toEqual({
      offsetX: 0,
      offsetY: 0,
    });
    expect(clampRectCropOffset(10, 10, draw.width, draw.height, 320, 80)).toEqual({
      offsetX: 0,
      offsetY: 0,
    });
    expect(clampRectCropOffset(0, -200, draw.width, draw.height, 320, 80)).toEqual({
      offsetX: 0,
      offsetY: -80,
    });
  });

  it("centers a landscape default frame", () => {
    const frame = defaultRectCropFrame(2000, 1000, 320, 80);
    expect(frame.scale).toBe(1);
    expect(frame.offsetX).toBe(0);
    expect(frame.offsetY).toBe(-40);
  });

  it("maps the rect view back onto source pixels", () => {
    const frame = defaultRectCropFrame(2000, 1000, 320, 80);
    const rect = rectCropSourceRect(2000, 1000, 320, 80, frame);
    expect(rect.sx).toBeCloseTo(0);
    expect(rect.sy).toBeCloseTo(250);
    expect(rect.sw).toBe(2000);
    expect(rect.sh).toBe(500);
  });

  it("maps a panned frame correctly", () => {
    const frame = { scale: 1, offsetX: 0, offsetY: 0 };
    const rect = rectCropSourceRect(2000, 1000, 320, 80, frame);
    expect(rect.sx).toBeCloseTo(0);
    expect(rect.sy).toBeCloseTo(0);
    expect(rect.sw).toBe(2000);
    expect(rect.sh).toBe(500);
  });
});

describe("cover crop constants", () => {
  it("output dimensions match Lock A master", () => {
    expect(COVER_CROP_OUTPUT_WIDTH).toBe(SOCIAL_PROFILE_COVER_LOCK_A.masterWidth);
    expect(COVER_CROP_OUTPUT_HEIGHT).toBe(SOCIAL_PROFILE_COVER_LOCK_A.masterHeight);
    expect(COVER_CROP_OUTPUT_WIDTH / COVER_CROP_OUTPUT_HEIGHT).toBe(4);
  });

  it("view aspect matches 4:1", () => {
    expect(COVER_CROP_VIEW_WIDTH / COVER_CROP_VIEW_HEIGHT).toBe(4);
  });

  it("output file is named cover.jpg", () => {
    expect(COVER_CROP_OUTPUT_NAME).toBe("cover.jpg");
  });

  it("max bytes allows up to 10 MB", () => {
    expect(COVER_CROP_MAX_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe("cover crop copy", () => {
  it("has the crop editor copy strings", () => {
    expect(SOCIAL.profile.coverCropTitle).toBe("Reposition cover");
    expect(SOCIAL.profile.coverCropSave).toBe("Save");
    expect(SOCIAL.profile.coverCropCancel).toBe("Cancel");
    expect(SOCIAL.profile.coverCropTarget).toContain("1784");
    expect(SOCIAL.profile.coverCropTarget).toContain("446");
    expect(SOCIAL.profile.coverCropFailed).toBeTruthy();
  });
});

describe("cover upload component", () => {
  it("uses the crop editor and shows visible errors", () => {
    const src = readFileSync(
      "src/components/social/social-profile-cover-upload.tsx",
      "utf8",
    );
    expect(src).toContain("SocialCoverCropEditor");
    expect(src).toContain("beginCrop");
    expect(src).toContain("onCropConfirm");
    expect(src).toContain("clearCrop");
    expect(src).toContain("cropRectFile");
    expect(src).toContain("presignSocialMediaUpload");
    expect(src).toContain('body.set("lane", "posts")');
    expect(src).toContain("saveSocialProfileCover");
    expect(src).not.toContain("Mux");
  });

  it("errors are not sr-only", () => {
    const src = readFileSync(
      "src/components/social/social-profile-cover-upload.tsx",
      "utf8",
    );
    const errorDiv = src.slice(src.lastIndexOf("aria-live"));
    expect(errorDiv).not.toContain("sr-only");
  });

  it("has Save and Cancel controls via the editor", () => {
    const editorSrc = readFileSync(
      "src/components/social/social-cover-crop-editor.tsx",
      "utf8",
    );
    expect(editorSrc).toContain("coverCropSave");
    expect(editorSrc).toContain("coverCropCancel");
    expect(editorSrc).toContain("coverCropTitle");
    expect(editorSrc).toContain("coverCropTarget");
    expect(editorSrc).toContain("rectCoverDrawSize");
    expect(editorSrc).toContain("clampRectCropOffset");
    expect(editorSrc).toContain("COVER_CROP_VIEW_WIDTH");
    expect(editorSrc).toContain("COVER_CROP_VIEW_HEIGHT");
  });

  it("clears file input on cancel via clearCrop", () => {
    const src = readFileSync(
      "src/components/social/social-profile-cover-upload.tsx",
      "utf8",
    );
    expect(src).toContain("clearCrop");
    expect(src).toContain('fileRef.current.value = ""');
    expect(src).toContain("onCancel={clearCrop}");
  });

  it("revokes blob preview after server save", () => {
    const src = readFileSync(
      "src/components/social/social-profile-cover-upload.tsx",
      "utf8",
    );
    expect(src).toContain("URL.revokeObjectURL(previewUrl)");
    const revokeCount = (src.match(/URL\.revokeObjectURL\(previewUrl\)/g) ?? []).length;
    expect(revokeCount).toBeGreaterThanOrEqual(3);
  });
});
