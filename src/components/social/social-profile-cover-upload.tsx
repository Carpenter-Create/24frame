"use client";

import { useRef, useState } from "react";

import { presignSocialMediaUpload, saveSocialProfileCover } from "@/app/(app)/social/actions";
import { SocialCoverCropEditor } from "@/components/social/social-cover-crop-editor";
import { SocialIcon } from "@/components/social/social-icon";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  type AvatarCropFrame,
  cropRectFile,
  readAccountAvatarCropPreview,
} from "@/lib/account-avatar-crop";
import { SOCIAL } from "@/lib/social";
import {
  COVER_CROP_MAX_BYTES,
  COVER_CROP_OUTPUT_HEIGHT,
  COVER_CROP_OUTPUT_NAME,
  COVER_CROP_OUTPUT_WIDTH,
  COVER_CROP_VIEW_HEIGHT,
  COVER_CROP_VIEW_WIDTH,
  SOCIAL_PROFILE_COVER_ACCEPT,
} from "@/lib/social-profile-cover";
import { SOCIAL_PROFILE_COVER_EDIT_CLASS } from "@/lib/social-chrome";
import { socialMediaKindFor } from "@/lib/social-media";
import { SOCIAL_ICON_SIZE_HEADER } from "@/lib/social-icons";
import { patchSocialProfileOptimistic } from "@/lib/social-profile-edit";

export function SocialProfileCoverUpload({
  onPreview,
}: {
  onPreview?: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPreview, setCropPreview] = useState<string | null>(null);
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | null>(null);

  function clearCrop() {
    if (cropPreview) URL.revokeObjectURL(cropPreview);
    setCropFile(null);
    setCropPreview(null);
    setCropSize(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function beginCrop(file: File | undefined) {
    if (!file || uploading) return;
    setError("");
    const kind = socialMediaKindFor(file.type);
    if (kind !== "image") {
      setError(SOCIAL.home.mediaType);
      return;
    }
    void readAccountAvatarCropPreview(file)
      .then((next) => {
        if (cropPreview) URL.revokeObjectURL(cropPreview);
        setCropFile(file);
        setCropPreview(next.url);
        setCropSize({ width: next.width, height: next.height });
      })
      .catch(() => {
        setError(SOCIAL.home.mediaType);
      });
  }

  async function onCropConfirm(frame: AvatarCropFrame) {
    if (!cropFile || uploading) return;
    setError("");
    setUploading(true);

    try {
      const cropped = await cropRectFile(
        cropFile,
        frame,
        COVER_CROP_VIEW_WIDTH,
        COVER_CROP_VIEW_HEIGHT,
        COVER_CROP_OUTPUT_WIDTH,
        COVER_CROP_OUTPUT_HEIGHT,
        COVER_CROP_OUTPUT_NAME,
        COVER_CROP_MAX_BYTES,
      );

      const previewUrl = URL.createObjectURL(cropped);
      onPreview?.(previewUrl);
      patchSocialProfileOptimistic({ coverUrl: previewUrl });
      clearCrop();

      const body = new FormData();
      body.set("content_type", cropped.type);
      body.set("byte_length", String(cropped.size));
      body.set("lane", "posts");
      const signed = await presignSocialMediaUpload(body);
      if (signed.error || !signed.url || !signed.key || !signed.kind || !signed.contentType) {
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
        JSON.stringify([{ kind: signed.kind, key: signed.key, contentType: signed.contentType }]),
      );
      const result = await saveSocialProfileCover(save);
      if (result.error) {
        onPreview?.(null);
        patchSocialProfileOptimistic({ coverUrl: null });
        URL.revokeObjectURL(previewUrl);
        setError(result.error);
      }
    } catch (e) {
      onPreview?.(null);
      patchSocialProfileOptimistic({ coverUrl: null });
      setError(
        e instanceof Error && e.message ? e.message : SOCIAL.profile.coverCropFailed,
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        data-social-profile-cover-edit=""
        disabled={uploading}
        aria-busy={uploading}
        aria-label={SOCIAL.profile.editCover}
        className={SOCIAL_PROFILE_COVER_EDIT_CLASS}
        onClick={() => fileRef.current?.click()}
      >
        <SocialIcon name="pencil-simple" size={SOCIAL_ICON_SIZE_HEADER} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept={SOCIAL_PROFILE_COVER_ACCEPT}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => beginCrop(e.target.files?.[0])}
      />
      {cropFile && cropPreview && cropSize ? (
        <SocialCoverCropEditor
          previewUrl={cropPreview}
          imageWidth={cropSize.width}
          imageHeight={cropSize.height}
          onCancel={clearCrop}
          onConfirm={(frame) => void onCropConfirm(frame)}
          pending={uploading}
        />
      ) : null}
      {error ? (
        <div aria-live="polite">
          <InlineNotice tone="error">{error}</InlineNotice>
        </div>
      ) : null}
    </>
  );
}
