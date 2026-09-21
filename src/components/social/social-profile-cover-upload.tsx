"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearSocialProfileCover,
  presignSocialMediaUpload,
  saveSocialProfileCover,
} from "@/app/(app)/social/actions";
import { SocialIcon } from "@/components/social/social-icon";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  type AvatarCropFrame,
  cropRectFile,
  readAccountAvatarCropPreview,
} from "@/lib/account-avatar-crop";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_COVER_BYTES_ROUTE } from "@/lib/social-edge";
import {
  coverFailureCopy,
  coverPreviewIsLocal,
} from "@/lib/social-profile-cover-load";
import {
  COVER_CROP_MAX_BYTES,
  COVER_CROP_OUTPUT_HEIGHT,
  COVER_CROP_OUTPUT_NAME,
  COVER_CROP_OUTPUT_WIDTH,
  COVER_CROP_VIEW_HEIGHT,
  COVER_CROP_VIEW_WIDTH,
  SOCIAL_PROFILE_COVER_ACCEPT,
  SOCIAL_PROFILE_COVER_LOCK_A,
} from "@/lib/social-profile-cover";
import {
  coverMenuClosesOnDocumentPress,
  nextCoverPillMode,
} from "@/lib/social-profile-cover-menu";
import {
  SOCIAL_PROFILE_COVER_DRAG_HINT_CLASS,
  SOCIAL_PROFILE_COVER_MENU_CLASS,
  SOCIAL_PROFILE_COVER_MENU_ITEM_CLASS,
  SOCIAL_PROFILE_COVER_PILL_CLASS,
  SOCIAL_PROFILE_COVER_REPOSITION_BAR_CLASS,
} from "@/lib/social-chrome";
import { socialMediaKindFor } from "@/lib/social-media";
import { SOCIAL_ICON_SIZE_HEADER } from "@/lib/social-icons";
import { patchSocialProfileOptimistic } from "@/lib/social-profile-edit";

type CoverMode = "idle" | "menu" | "reposition";

async function fileFromResponse(response: Response): Promise<File> {
  if (!response.ok) throw new Error(SOCIAL.profile.coverCropFailed);
  const blob = await response.blob();
  const type = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
  return new File([blob], "cover-source", { type });
}

/** Same-origin owner bytes. redirect:error so a CDN 302 is never followed. */
async function fileFromOwnCover(): Promise<File> {
  const response = await fetch(SOCIAL_COVER_BYTES_ROUTE, { redirect: "error" });
  return fileFromResponse(response);
}

async function fileFromLocalPreview(url: string): Promise<File> {
  const response = await fetch(url);
  return fileFromResponse(response);
}

export function SocialProfileCoverUpload({
  coverUrl,
  onPreview,
}: {
  coverUrl?: string | null;
  onPreview?: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const ownedPreview = useRef<string | null>(null);
  const loadGen = useRef(0);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<CoverMode>("idle");

  const [repositionFile, setRepositionFile] = useState<File | null>(null);
  const [repositionPreview, setRepositionPreview] = useState<string | null>(null);
  const [repositionSize, setRepositionSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const hasCover = Boolean(coverUrl?.trim());

  // Arm the outside listener on a later turn than the open click so that
  // gesture cannot close the menu. A press on the pill is stopped above
  // and is not an outside close; the click toggles.
  useEffect(() => {
    if (mode !== "menu") return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMode((current) => (current === "menu" ? "idle" : current));
    };
    const onPointer = (event: MouseEvent) => {
      const host = menuRef.current;
      const inside = Boolean(host?.contains(event.target as Node));
      if (!coverMenuClosesOnDocumentPress("menu", inside)) return;
      setMode((current) => (current === "menu" ? "idle" : current));
    };
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointer);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [mode]);

  useEffect(() => {
    return () => {
      loadGen.current += 1;
      const prev = ownedPreview.current;
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
    };
  }, []);

  const releaseOwnedPreview = useCallback(() => {
    const prev = ownedPreview.current;
    if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
    ownedPreview.current = null;
  }, []);

  const rememberPreview = useCallback(
    (url: string, owned: boolean) => {
      releaseOwnedPreview();
      if (owned && url.startsWith("blob:")) ownedPreview.current = url;
      setRepositionPreview(url);
    },
    [releaseOwnedPreview],
  );

  function clearReposition() {
    releaseOwnedPreview();
    setRepositionFile(null);
    setRepositionPreview(null);
    setRepositionSize(null);
    setPanOffset({ x: 0, y: 0 });
    if (fileRef.current) fileRef.current.value = "";
  }

  function cancelReposition() {
    loadGen.current += 1;
    clearReposition();
    setUploading(false);
    setError("");
    setMode("idle");
  }

  function beginUpload() {
    setMode("idle");
    fileRef.current?.click();
  }

  function beginReposition() {
    const url = coverUrl?.trim();
    if (!url || uploading) return;
    loadGen.current += 1;
    setError("");
    setRepositionFile(null);
    setRepositionSize(null);
    setPanOffset({ x: 0, y: 0 });
    rememberPreview(url, false);
    setMode("reposition");
  }

  async function removeCover() {
    setMode("idle");
    setError("");
    setUploading(true);
    try {
      patchSocialProfileOptimistic({ coverUrl: null });
      onPreview?.(null);
      const result = await clearSocialProfileCover();
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError(SOCIAL.profile.coverCropFailed);
    } finally {
      setUploading(false);
    }
  }

  function onFilePick(file: File | undefined) {
    if (!file || uploading) return;
    setError("");
    const kind = socialMediaKindFor(file.type);
    if (kind !== "image") {
      setError(SOCIAL.home.mediaType);
      return;
    }
    void readAccountAvatarCropPreview(file)
      .then((next) => {
        clearReposition();
        setRepositionFile(file);
        rememberPreview(next.url, true);
        setRepositionSize({ width: next.width, height: next.height });
        setPanOffset({ x: 0, y: 0 });
        setMode("reposition");
      })
      .catch(() => {
        setError(SOCIAL.home.mediaType);
      });
  }

  function computeCropFrame(size: { width: number; height: number } | null): AvatarCropFrame {
    if (!size) return { scale: 1, offsetX: 0, offsetY: 0 };
    const { width: imgW, height: imgH } = size;
    const viewW = COVER_CROP_VIEW_WIDTH;
    const viewH = COVER_CROP_VIEW_HEIGHT;
    const cover = Math.max(viewW / imgW, viewH / imgH);
    const drawW = imgW * cover;
    const drawH = imgH * cover;
    const centerX = (viewW - drawW) / 2;
    const centerY = (viewH - drawH) / 2;
    const bandH = SOCIAL_PROFILE_COVER_LOCK_A.heightDesktop;
    const panScaleX =
      viewW /
      (bandH *
        (SOCIAL_PROFILE_COVER_LOCK_A.aspectWidth /
          SOCIAL_PROFILE_COVER_LOCK_A.aspectHeight));
    const panScaleY = viewH / bandH;
    return {
      scale: 1,
      offsetX: centerX + panOffset.x * panScaleX,
      offsetY: centerY + panOffset.y * panScaleY,
    };
  }

  async function onSaveReposition() {
    if (uploading) return;
    setError("");
    setUploading(true);
    let previewUrl: string | null = null;

    try {
      let file = repositionFile;
      if (!file) {
        const url = coverUrl?.trim() || repositionPreview;
        if (!url) throw new Error(SOCIAL.profile.coverCropFailed);
        file = coverPreviewIsLocal(url) ? await fileFromLocalPreview(url) : await fileFromOwnCover();
      }
      let size = repositionSize;
      if (!size) {
        const measured = await readAccountAvatarCropPreview(file);
        size = { width: measured.width, height: measured.height };
        URL.revokeObjectURL(measured.url);
      }
      const frame = computeCropFrame(size);
      const cropped = await cropRectFile(
        file,
        frame,
        COVER_CROP_VIEW_WIDTH,
        COVER_CROP_VIEW_HEIGHT,
        COVER_CROP_OUTPUT_WIDTH,
        COVER_CROP_OUTPUT_HEIGHT,
        COVER_CROP_OUTPUT_NAME,
        COVER_CROP_MAX_BYTES,
      );

      previewUrl = URL.createObjectURL(cropped);
      onPreview?.(previewUrl);
      patchSocialProfileOptimistic({ coverUrl: previewUrl });

      const body = new FormData();
      body.set("content_type", cropped.type);
      body.set("byte_length", String(cropped.size));
      body.set("lane", "posts");
      const signed = await presignSocialMediaUpload(body);
      if (
        signed.error ||
        !signed.url ||
        !signed.key ||
        !signed.kind ||
        !signed.contentType
      ) {
        onPreview?.(null);
        patchSocialProfileOptimistic({ coverUrl: null });
        URL.revokeObjectURL(previewUrl);
        setError(signed.error ?? SOCIAL.home.uploadFailed);
        return;
      }

      const put = await fetch(signed.url, {
        method: "PUT",
        headers: { "Content-Type": signed.contentType },
        body: cropped,
      });
      if (!put.ok) {
        onPreview?.(null);
        patchSocialProfileOptimistic({ coverUrl: null });
        URL.revokeObjectURL(previewUrl);
        setError(SOCIAL.home.uploadFailed);
        return;
      }

      const save = new FormData();
      save.set(
        "media",
        JSON.stringify([
          {
            kind: signed.kind,
            key: signed.key,
            contentType: signed.contentType,
          },
        ]),
      );
      const result = await saveSocialProfileCover(save);
      if (result.error) {
        onPreview?.(null);
        patchSocialProfileOptimistic({ coverUrl: null });
        URL.revokeObjectURL(previewUrl);
        setError(result.error);
      } else {
        clearReposition();
        setMode("idle");
      }
    } catch (e) {
      if (previewUrl) {
        onPreview?.(null);
        patchSocialProfileOptimistic({ coverUrl: null });
        URL.revokeObjectURL(previewUrl);
      }
      setError(
        coverFailureCopy(
          e,
          previewUrl ? SOCIAL.home.uploadFailed : SOCIAL.profile.coverCropFailed,
        ),
      );
    } finally {
      setUploading(false);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (mode !== "reposition") return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: panOffset.x,
      originY: panOffset.y,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || mode !== "reposition") return;
    setPanOffset({
      x: dragRef.current.originX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.originY + (e.clientY - dragRef.current.startY),
    });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  const isReposition = mode === "reposition";
  const showPreview = isReposition && repositionPreview;

  return (
    <>
      {/* --- Reposition mode: bar + hint + draggable preview inside the cover band --- */}
      {isReposition ? (
        <>
          <div
            data-social-cover-reposition-bar=""
            className={SOCIAL_PROFILE_COVER_REPOSITION_BAR_CLASS}
          >
            <p className="t-body-sm text-band-ink/80">
              {SOCIAL.profile.coverPublicNote}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={uploading}
                className="rounded-[6px] border border-band-ink/30 bg-transparent px-3 py-1 t-body-sm font-medium text-band-ink hover:bg-band-ink/10"
                onClick={cancelReposition}
              >
                {SOCIAL.profile.coverCancel}
              </button>
              <button
                type="button"
                disabled={uploading}
                className="rounded-[6px] bg-accent px-3 py-1 t-body-sm font-medium text-accent-contrast hover:opacity-90 disabled:opacity-60"
                onClick={() => void onSaveReposition()}
              >
                {uploading
                  ? SOCIAL.profile.uploadingPhoto
                  : SOCIAL.profile.coverSaveChanges}
              </button>
            </div>
          </div>
          <div className={SOCIAL_PROFILE_COVER_DRAG_HINT_CLASS}>
            <span className="flex items-center gap-2 rounded-[8px] bg-ink/60 px-3 py-1.5 t-body-sm font-medium text-band-ink">
              {SOCIAL.profile.coverDragHint}
            </span>
          </div>
          {showPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob for reposition preview
            <img
              src={repositionPreview}
              alt=""
              draggable={false}
              className="absolute inset-0 size-full cursor-grab touch-none select-none object-cover opacity-70 active:cursor-grabbing"
              style={{
                objectPosition: `calc(50% + ${panOffset.x}px) calc(50% + ${panOffset.y}px)`,
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onLoad={(event) => {
                const image = event.currentTarget;
                if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                  setRepositionSize({ width: image.naturalWidth, height: image.naturalHeight });
                }
              }}
              onError={() => setError(SOCIAL.profile.coverCropFailed)}
            />
          ) : null}
        </>
      ) : null}

      {/* --- Idle / menu mode: pill + dropdown below cover --- */}
      {!isReposition ? (
        <div
          className="absolute bottom-3 right-3 z-20"
          ref={menuRef}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            data-social-profile-cover-edit=""
            disabled={uploading}
            aria-busy={uploading}
            aria-expanded={mode === "menu"}
            aria-haspopup="menu"
            aria-label={
              hasCover ? SOCIAL.profile.editCover : SOCIAL.profile.addCover
            }
            className={SOCIAL_PROFILE_COVER_PILL_CLASS}
            onClick={() => {
              setMode((current) => {
                if (current === "reposition") return current;
                return nextCoverPillMode(current);
              });
            }}
          >
            <SocialIcon name="camera" size={SOCIAL_ICON_SIZE_HEADER} />
            <span>
              {hasCover ? SOCIAL.profile.editCover : SOCIAL.profile.addCover}
            </span>
          </button>

          {mode === "menu" ? (
            <div
              data-social-cover-menu=""
              className={SOCIAL_PROFILE_COVER_MENU_CLASS}
            >
              <button
                type="button"
                className={SOCIAL_PROFILE_COVER_MENU_ITEM_CLASS}
                onClick={beginUpload}
              >
                <SocialIcon name="image" size={SOCIAL_ICON_SIZE_HEADER} />
                {SOCIAL.profile.coverChoose}
              </button>
              <button
                type="button"
                className={SOCIAL_PROFILE_COVER_MENU_ITEM_CLASS}
                onClick={beginUpload}
              >
                <SocialIcon
                  name="upload-simple"
                  size={SOCIAL_ICON_SIZE_HEADER}
                />
                {SOCIAL.profile.coverUpload}
              </button>
              {hasCover ? (
                <>
                  <button
                    type="button"
                    className={SOCIAL_PROFILE_COVER_MENU_ITEM_CLASS}
                    onClick={beginReposition}
                  >
                    <SocialIcon
                      name="image"
                      size={SOCIAL_ICON_SIZE_HEADER}
                    />
                    {SOCIAL.profile.coverReposition}
                  </button>
                  <button
                    type="button"
                    className={SOCIAL_PROFILE_COVER_MENU_ITEM_CLASS}
                    onClick={() => void removeCover()}
                  >
                    <SocialIcon
                      name="trash"
                      size={SOCIAL_ICON_SIZE_HEADER}
                    />
                    {SOCIAL.profile.coverRemove}
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept={SOCIAL_PROFILE_COVER_ACCEPT}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => onFilePick(e.target.files?.[0])}
      />
      {error ? (
        <div className="absolute inset-x-3 bottom-12 z-30" aria-live="polite">
          <InlineNotice tone="error">{error}</InlineNotice>
        </div>
      ) : null}
    </>
  );
}
