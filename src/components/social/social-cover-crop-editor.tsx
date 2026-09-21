"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AVATAR_CROP_MAX_SCALE,
  AVATAR_CROP_MIN_SCALE,
  clampRectCropOffset,
  defaultRectCropFrame,
  rectCoverDrawSize,
  type AvatarCropFrame,
} from "@/lib/account-avatar-crop";
import { SOCIAL } from "@/lib/social";
import {
  COVER_CROP_VIEW_HEIGHT,
  COVER_CROP_VIEW_WIDTH,
} from "@/lib/social-profile-cover";

export function SocialCoverCropEditor({
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
    defaultRectCropFrame(imageWidth, imageHeight, COVER_CROP_VIEW_WIDTH, COVER_CROP_VIEW_HEIGHT),
  );
  const drag = useRef<{ x: number; y: number; origin: AvatarCropFrame } | null>(null);
  const draw = rectCoverDrawSize(
    imageWidth,
    imageHeight,
    COVER_CROP_VIEW_WIDTH,
    COVER_CROP_VIEW_HEIGHT,
    frame.scale,
  );

  function moveTo(next: AvatarCropFrame) {
    const size = rectCoverDrawSize(
      imageWidth,
      imageHeight,
      COVER_CROP_VIEW_WIDTH,
      COVER_CROP_VIEW_HEIGHT,
      next.scale,
    );
    setFrame({
      scale: next.scale,
      ...clampRectCropOffset(
        next.offsetX,
        next.offsetY,
        size.width,
        size.height,
        COVER_CROP_VIEW_WIDTH,
        COVER_CROP_VIEW_HEIGHT,
      ),
    });
  }

  return (
    <div data-social-cover-crop="" className="flex flex-col items-center gap-4">
      <p className="t-body-sm font-semibold text-ink">
        {SOCIAL.profile.coverCropTitle}
      </p>
      <div
        data-social-cover-crop-view=""
        className="relative overflow-hidden rounded-[var(--radius-sm)] bg-surface-muted"
        style={{ width: COVER_CROP_VIEW_WIDTH, height: COVER_CROP_VIEW_HEIGHT }}
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
      <label className="flex w-full max-w-[320px] flex-col gap-2">
        <span className="sr-only">{SOCIAL.profile.coverCropTitle}</span>
        <input
          type="range"
          min={AVATAR_CROP_MIN_SCALE}
          max={AVATAR_CROP_MAX_SCALE}
          step={0.05}
          value={frame.scale}
          onChange={(event) => {
            const scale = Number(event.target.value);
            const curr = rectCoverDrawSize(
              imageWidth,
              imageHeight,
              COVER_CROP_VIEW_WIDTH,
              COVER_CROP_VIEW_HEIGHT,
              frame.scale,
            );
            const next = rectCoverDrawSize(
              imageWidth,
              imageHeight,
              COVER_CROP_VIEW_WIDTH,
              COVER_CROP_VIEW_HEIGHT,
              scale,
            );
            const midX = frame.offsetX - (COVER_CROP_VIEW_WIDTH - curr.width) / 2;
            const midY = frame.offsetY - (COVER_CROP_VIEW_HEIGHT - curr.height) / 2;
            moveTo({
              scale,
              offsetX:
                (COVER_CROP_VIEW_WIDTH - next.width) / 2 +
                midX * (next.width / curr.width),
              offsetY:
                (COVER_CROP_VIEW_HEIGHT - next.height) / 2 +
                midY * (next.height / curr.height),
            });
          }}
        />
      </label>
      <p className="t-body-sm text-ink-2">
        {SOCIAL.profile.coverCropTarget}
      </p>
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" disabled={pending} onClick={onCancel}>
          {SOCIAL.profile.coverCropCancel}
        </Button>
        <Button type="button" disabled={pending} onClick={() => onConfirm(frame)}>
          {pending ? SOCIAL.profile.uploadingPhoto : SOCIAL.profile.coverCropSave}
        </Button>
      </div>
    </div>
  );
}
