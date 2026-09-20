// Square face crop for the account photo SoT. Output replaces
// avatars/{userId}/avatar via uploadAccountPhoto. No Social-only fork.

import { AVATAR_MAX_BYTES } from "@/lib/account-avatar";

export const AVATAR_CROP_OUTPUT_SIZE = 512;
export const AVATAR_CROP_MIN_SCALE = 1;
export const AVATAR_CROP_MAX_SCALE = 3;
export const AVATAR_CROP_VIEW_SIZE = 280;
export const AVATAR_CROP_OUTPUT_TYPE = "image/jpeg";
export const AVATAR_CROP_OUTPUT_QUALITY = 0.92;
export const AVATAR_CROP_OUTPUT_NAME = "avatar.jpg";

export type AvatarCropFrame = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export function avatarCoverDrawSize(
  imageWidth: number,
  imageHeight: number,
  viewSize: number,
  scale: number,
): { width: number; height: number } {
  const safeScale = Math.min(AVATAR_CROP_MAX_SCALE, Math.max(AVATAR_CROP_MIN_SCALE, scale));
  const cover = Math.max(viewSize / imageWidth, viewSize / imageHeight) * safeScale;
  return { width: imageWidth * cover, height: imageHeight * cover };
}

export function clampAvatarCropOffset(
  offsetX: number,
  offsetY: number,
  drawWidth: number,
  drawHeight: number,
  viewSize: number,
): { offsetX: number; offsetY: number } {
  const minX = Math.min(0, viewSize - drawWidth);
  const minY = Math.min(0, viewSize - drawHeight);
  return {
    offsetX: Math.min(0, Math.max(minX, offsetX)),
    offsetY: Math.min(0, Math.max(minY, offsetY)),
  };
}

export function defaultAvatarCropFrame(
  imageWidth: number,
  imageHeight: number,
  viewSize: number,
): AvatarCropFrame {
  const draw = avatarCoverDrawSize(imageWidth, imageHeight, viewSize, 1);
  return {
    scale: 1,
    offsetX: (viewSize - draw.width) / 2,
    offsetY: (viewSize - draw.height) / 2,
  };
}

export function avatarCropSourceRect(
  imageWidth: number,
  imageHeight: number,
  viewSize: number,
  frame: AvatarCropFrame,
): { sx: number; sy: number; sw: number; sh: number } {
  const draw = avatarCoverDrawSize(imageWidth, imageHeight, viewSize, frame.scale);
  const clamped = clampAvatarCropOffset(frame.offsetX, frame.offsetY, draw.width, draw.height, viewSize);
  const scale = draw.width / imageWidth;
  return {
    sx: -clamped.offsetX / scale + 0,
    sy: -clamped.offsetY / scale + 0,
    sw: viewSize / scale,
    sh: viewSize / scale,
  };
}

export async function cropAvatarFile(
  file: File,
  frame: AvatarCropFrame,
  viewSize = AVATAR_CROP_VIEW_SIZE,
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const source = avatarCropSourceRect(bitmap.width, bitmap.height, viewSize, frame);
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_CROP_OUTPUT_SIZE;
    canvas.height = AVATAR_CROP_OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not crop photo.");
    ctx.drawImage(
      bitmap,
      source.sx,
      source.sy,
      source.sw,
      source.sh,
      0,
      0,
      AVATAR_CROP_OUTPUT_SIZE,
      AVATAR_CROP_OUTPUT_SIZE,
    );
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (next) => (next ? resolve(next) : reject(new Error("Could not crop photo."))),
        AVATAR_CROP_OUTPUT_TYPE,
        AVATAR_CROP_OUTPUT_QUALITY,
      );
    });
    if (blob.size > AVATAR_MAX_BYTES) {
      throw new Error("Photo must be 2 MB or smaller.");
    }
    return new File([blob], AVATAR_CROP_OUTPUT_NAME, { type: AVATAR_CROP_OUTPUT_TYPE });
  } finally {
    bitmap.close();
  }
}
