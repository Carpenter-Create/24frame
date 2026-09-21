"use client";

import { useRef, useState } from "react";

import { presignSocialMediaUpload, saveSocialProfileCover } from "@/app/(app)/social/actions";
import { SocialIcon } from "@/components/social/social-icon";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SOCIAL_PROFILE_COVER_ACCEPT, SOCIAL_PROFILE_COVER_LOCK_A } from "@/lib/social-profile-cover";
import { SOCIAL_PROFILE_COVER_EDIT_CLASS } from "@/lib/social-chrome";
import { SOCIAL } from "@/lib/social";
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

  async function onPick(file: File | undefined) {
    if (!file || uploading) return;
    setError("");
    const kind = socialMediaKindFor(file.type);
    if (kind !== "image") {
      setError(SOCIAL.home.mediaType);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    onPreview?.(previewUrl);
    patchSocialProfileOptimistic({ coverUrl: previewUrl });
    setUploading(true);
    const body = new FormData();
    body.set("content_type", file.type);
    body.set("byte_length", String(file.size));
    body.set("lane", "posts");
    const signed = await presignSocialMediaUpload(body);
    if (signed.error || !signed.url || !signed.key || !signed.kind || !signed.contentType) {
      setUploading(false);
      onPreview?.(null);
      patchSocialProfileOptimistic({ coverUrl: null });
      URL.revokeObjectURL(previewUrl);
      if (fileRef.current) fileRef.current.value = "";
      setError(signed.error ?? SOCIAL.home.uploadFailed);
      return;
    }
    const put = await fetch(signed.url, {
      method: "PUT",
      headers: { "Content-Type": signed.contentType },
      body: file,
    });
    if (!put.ok) {
      setUploading(false);
      onPreview?.(null);
      patchSocialProfileOptimistic({ coverUrl: null });
      URL.revokeObjectURL(previewUrl);
      if (fileRef.current) fileRef.current.value = "";
      setError(SOCIAL.home.uploadFailed);
      return;
    }
    const save = new FormData();
    save.set(
      "media",
      JSON.stringify([{ kind: signed.kind, key: signed.key, contentType: signed.contentType }]),
    );
    const result = await saveSocialProfileCover(save);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (result.error) {
      onPreview?.(null);
      patchSocialProfileOptimistic({ coverUrl: null });
      URL.revokeObjectURL(previewUrl);
      setError(result.error);
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
        title={SOCIAL.profile.coverDims}
        className={SOCIAL_PROFILE_COVER_EDIT_CLASS}
        onClick={() => fileRef.current?.click()}
      >
        <SocialIcon name="pencil-simple" size={SOCIAL_ICON_SIZE_HEADER} />
      </button>
      <span
        data-social-profile-cover-dims=""
        className="absolute bottom-2 right-3 z-10 rounded bg-surface/80 px-2 py-0.5 text-[length:var(--text-xs)] font-medium text-ink-2"
      >
        {SOCIAL_PROFILE_COVER_LOCK_A.masterWidth} × {SOCIAL_PROFILE_COVER_LOCK_A.masterHeight} px
      </span>
      <input
        ref={fileRef}
        type="file"
        accept={SOCIAL_PROFILE_COVER_ACCEPT}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void onPick(e.target.files?.[0])}
      />
      {error ? (
        <div className="sr-only" aria-live="polite">
          <InlineNotice tone="error">{error}</InlineNotice>
        </div>
      ) : null}
    </>
  );
}
