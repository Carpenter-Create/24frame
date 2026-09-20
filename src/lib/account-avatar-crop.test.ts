import { describe, expect, it } from "vitest";

import {
  AVATAR_CROP_MAX_SCALE,
  AVATAR_CROP_MIN_SCALE,
  avatarCoverDrawSize,
  avatarCropSourceRect,
  clampAvatarCropOffset,
  defaultAvatarCropFrame,
} from "./account-avatar-crop";

describe("account avatar crop", () => {
  it("cover-fits a landscape still into the square and clamps pan", () => {
    const draw = avatarCoverDrawSize(200, 100, 100, 1);
    expect(draw.height).toBe(100);
    expect(draw.width).toBe(200);
    expect(clampAvatarCropOffset(-80, 0, draw.width, draw.height, 100)).toEqual({
      offsetX: -80,
      offsetY: 0,
    });
    expect(clampAvatarCropOffset(20, 10, draw.width, draw.height, 100)).toEqual({
      offsetX: 0,
      offsetY: 0,
    });
    expect(clampAvatarCropOffset(-400, -10, draw.width, draw.height, 100)).toEqual({
      offsetX: -100,
      offsetY: 0,
    });
  });

  it("centers the default frame and maps the view back onto the source", () => {
    const frame = defaultAvatarCropFrame(200, 100, 100);
    expect(frame.scale).toBe(1);
    expect(frame.offsetX).toBe(-50);
    expect(frame.offsetY).toBe(0);
    expect(avatarCropSourceRect(200, 100, 100, frame)).toEqual({
      sx: 50,
      sy: 0,
      sw: 100,
      sh: 100,
    });
    expect(AVATAR_CROP_MIN_SCALE).toBe(1);
    expect(AVATAR_CROP_MAX_SCALE).toBe(3);
  });
});
