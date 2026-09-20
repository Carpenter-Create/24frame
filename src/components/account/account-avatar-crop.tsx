"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AVATAR_CROP_MAX_SCALE,
  AVATAR_CROP_MIN_SCALE,
  AVATAR_CROP_VIEW_SIZE,
  avatarCoverDrawSize,
  clampAvatarCropOffset,
  defaultAvatarCropFrame,
  type AvatarCropFrame,
} from "@/lib/account-avatar-crop";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";

export function AccountAvatarCrop({
  previewUrl,
  imageWidth,
  imageHeight,
  onCancel,
  onConfirm,
  pending = false,
}: {
  previewUrl: string;
  imageWidth: number;
  imageHeight: number;
  onCancel: () => void;
  onConfirm: (frame: AvatarCropFrame) => void;
  pending?: boolean;
}) {
  const [frame, setFrame] = useState<AvatarCropFrame>(() =>
    defaultAvatarCropFrame(imageWidth, imageHeight, AVATAR_CROP_VIEW_SIZE),
  );
  const drag = useRef<{ x: number; y: number; origin: AvatarCropFrame } | null>(null);
  const draw = avatarCoverDrawSize(imageWidth, imageHeight, AVATAR_CROP_VIEW_SIZE, frame.scale);

  function moveTo(next: AvatarCropFrame) {
    const size = avatarCoverDrawSize(imageWidth, imageHeight, AVATAR_CROP_VIEW_SIZE, next.scale);
    setFrame({
      scale: next.scale,
      ...clampAvatarCropOffset(next.offsetX, next.offsetY, size.width, size.height, AVATAR_CROP_VIEW_SIZE),
    });
  }

  return (
    <div data-account-avatar-crop="" className="flex flex-col items-center gap-4">
      <p className="t-body-sm font-semibold text-ink">{ACCOUNT_PROFILE.cropTitle}</p>
      <div
        data-account-avatar-crop-view=""
        className="relative overflow-hidden rounded-full bg-surface-muted"
        style={{ width: AVATAR_CROP_VIEW_SIZE, height: AVATAR_CROP_VIEW_SIZE }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, origin: frame };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          moveTo({
            scale: drag.current.origin.scale,
            offsetX: drag.current.origin.offsetX + (event.clientX - drag.current.x),
            offsetY: drag.current.origin.offsetY + (event.clientY - drag.current.y),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL for crop preview */}
        <img
          src={previewUrl}
          alt=""
          draggable={false}
          className="absolute max-w-none select-none"
          style={{
            width: draw.width,
            height: draw.height,
            left: frame.offsetX,
            top: frame.offsetY,
          }}
        />
      </div>
      <label className="flex w-full flex-col gap-2">
        <span className="sr-only">{ACCOUNT_PROFILE.cropTitle}</span>
        <input
          type="range"
          min={AVATAR_CROP_MIN_SCALE}
          max={AVATAR_CROP_MAX_SCALE}
          step={0.05}
          value={frame.scale}
          onChange={(event) => {
            const scale = Number(event.target.value);
            const next = avatarCoverDrawSize(imageWidth, imageHeight, AVATAR_CROP_VIEW_SIZE, scale);
            const current = avatarCoverDrawSize(imageWidth, imageHeight, AVATAR_CROP_VIEW_SIZE, frame.scale);
            const midX = frame.offsetX - (AVATAR_CROP_VIEW_SIZE - current.width) / 2;
            const midY = frame.offsetY - (AVATAR_CROP_VIEW_SIZE - current.height) / 2;
            moveTo({
              scale,
              offsetX: (AVATAR_CROP_VIEW_SIZE - next.width) / 2 + midX * (next.width / current.width),
              offsetY: (AVATAR_CROP_VIEW_SIZE - next.height) / 2 + midY * (next.height / current.height),
            });
          }}
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" disabled={pending} onClick={onCancel}>
          {ACCOUNT_PROFILE.cropCancel}
        </Button>
        <Button type="button" disabled={pending} onClick={() => onConfirm(frame)}>
          {pending ? ACCOUNT_PROFILE.uploadingPhoto : ACCOUNT_PROFILE.cropSave}
        </Button>
      </div>
    </div>
  );
}
