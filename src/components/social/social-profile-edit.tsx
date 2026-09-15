"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { uploadAccountPhoto } from "@/app/(app)/account/actions";
import { createSocialProfile } from "@/app/(app)/social/actions";
import { SocialIcon } from "@/components/social/social-icon";
import { InlineNotice } from "@/components/ui/inline-notice";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { AVATAR_ACCEPT, AVATAR_MAX_BYTES, isAvatarContentType } from "@/lib/account-avatar";
import {
  SOCIAL_PROFILE_EDIT_AVATAR_CLASS,
  SOCIAL_PROFILE_EDIT_BACK_CLASS,
  SOCIAL_PROFILE_EDIT_BODY_CLASS,
  SOCIAL_PROFILE_EDIT_CARD_CLASS,
  SOCIAL_PROFILE_EDIT_DONE_CLASS,
  SOCIAL_PROFILE_EDIT_HANDLE_CLASS,
  SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS,
  SOCIAL_PROFILE_EDIT_HEADER_CLASS,
  SOCIAL_PROFILE_EDIT_HOST_CLASS,
  SOCIAL_PROFILE_EDIT_LABEL_CLASS,
  SOCIAL_PROFILE_EDIT_PHOTO_CLASS,
  SOCIAL_PROFILE_EDIT_PICTURE_CLASS,
  SOCIAL_PROFILE_EDIT_ROW_CLASS,
  SOCIAL_PROFILE_EDIT_SHEET_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_HEADER } from "@/lib/social-icons";
import {
  BIO_MAX,
  SOCIAL,
  SOCIAL_ROUTES,
  bareHandle,
  handleFieldValue,
  socialHandleRequiredError,
  socialProfilePublicUrl,
  stripHandleDecorators,
} from "@/lib/social";

function EditHeader({
  title,
  backHref,
  done,
  pending,
}: {
  title: string;
  backHref: string;
  done: () => void;
  pending: boolean;
}) {
  return (
    <header data-social-profile-edit-header="" className={SOCIAL_PROFILE_EDIT_HEADER_CLASS}>
      <Link href={backHref} className={SOCIAL_PROFILE_EDIT_BACK_CLASS} aria-label={SOCIAL.profile.back}>
        <SocialIcon name="caret-left" size={SOCIAL_ICON_SIZE_HEADER} />
      </Link>
      <h1 className="min-w-0 flex-1 text-center text-[17px] font-semibold text-ink">{title}</h1>
      <button
        type="button"
        data-social-profile-edit-done=""
        disabled={pending}
        onClick={done}
        className={SOCIAL_PROFILE_EDIT_DONE_CLASS}
      >
        {SOCIAL.profile.done}
      </button>
    </header>
  );
}

export function SocialProfileEditForm({
  handle,
  displayName,
  bio,
  photoUrl,
}: {
  handle: string;
  displayName: string;
  bio: string;
  photoUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(displayName);
  const [username, setUsername] = useState(handleFieldValue(handle));
  const [error, setError] = useState("");
  const [handleError, setHandleError] = useState("");
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const preview = socialProfilePublicUrl(bareHandle(username));
  const required = socialHandleRequiredError(username);

  function applyHandle(raw: string) {
    setUsername(`@${stripHandleDecorators(raw)}`);
    setHandleError("");
  }

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!isAvatarContentType(file.type)) {
      setError(ACCOUNT_PROFILE.photoType);
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError(ACCOUNT_PROFILE.photoTooLarge);
      return;
    }
    setUploading(true);
    const body = new FormData();
    body.set("photo", file);
    const res = await uploadAccountPhoto(body);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function onDone() {
    setError("");
    if (required) {
      setHandleError(required);
      return;
    }
    setPending(true);
    const form = new FormData();
    form.set("handle", username);
    form.set("display_name", name);
    const result = await createSocialProfile(form);
    setPending(false);
    if (result.error) {
      if (result.error === SOCIAL.profile.handleRequired) setHandleError(result.error);
      else setError(result.error);
      return;
    }
    router.push(SOCIAL_ROUTES.profile);
  }

  return (
    <div data-social-profile-edit="" className={SOCIAL_PROFILE_EDIT_HOST_CLASS}>
      <div className={SOCIAL_PROFILE_EDIT_SHEET_CLASS}>
        <EditHeader
          title={SOCIAL.profile.edit}
          backHref={SOCIAL_ROUTES.profile}
          done={() => void onDone()}
          pending={pending}
        />
        <div className={SOCIAL_PROFILE_EDIT_BODY_CLASS}>
          <div data-social-profile-edit-photo="" className={SOCIAL_PROFILE_EDIT_PHOTO_CLASS}>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className={SOCIAL_PROFILE_EDIT_AVATAR_CLASS}
              aria-label={SOCIAL.profile.editPicture}
            >
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the private avatars bucket
                <img src={photoUrl} alt="" className="size-full object-cover" />
              ) : (
                <SocialIcon name="camera" size={28} className="text-ink-2" />
              )}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className={SOCIAL_PROFILE_EDIT_PICTURE_CLASS}
            >
              {uploading ? SOCIAL.profile.uploadingPhoto : SOCIAL.profile.editPicture}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="sr-only"
              aria-label={SOCIAL.profile.editPicture}
              onChange={(e) => void onPick(e.target.files?.[0])}
            />
          </div>
          <div data-social-profile-edit-fields="" className={SOCIAL_PROFILE_EDIT_CARD_CLASS}>
            <div className={SOCIAL_PROFILE_EDIT_ROW_CLASS}>
              <label htmlFor="social-edit-name" className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
                {SOCIAL.profile.name}
              </label>
              <input
                id="social-edit-name"
                name="display_name"
                autoComplete="nickname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-w-0 flex-1 bg-transparent t-body-sm text-ink outline-none"
              />
            </div>
            <div className="h-px bg-hairline" />
            <div data-social-handle-field="" className="flex flex-col gap-2 py-4">
              <div className="flex items-start gap-4">
                <label htmlFor="social-edit-handle" className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
                  {SOCIAL.profile.username}
                </label>
                <div className={handleError ? SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS : SOCIAL_PROFILE_EDIT_HANDLE_CLASS}>
                  <span className="font-medium text-ink-2">@</span>
                  <input
                    id="social-edit-handle"
                    name="handle"
                    autoComplete="username"
                    value={bareHandle(username)}
                    placeholder={SOCIAL.profile.usernamePlaceholder}
                    onChange={(e) => applyHandle(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-2"
                  />
                </div>
              </div>
              {handleError ? (
                <p data-social-handle-required="" className="t-label text-ink">
                  {handleError}
                </p>
              ) : null}
              <p data-social-handle-url="" className="t-label text-ink-2">
                {preview}
              </p>
            </div>
            <div className="h-px bg-hairline" />
            <Link href={SOCIAL_ROUTES.profileBio} className={SOCIAL_PROFILE_EDIT_ROW_CLASS}>
              <span className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>{SOCIAL.profile.bio}</span>
              <span className="flex min-w-0 flex-1 items-start gap-2">
                <span
                  data-social-profile-edit-bio=""
                  className="min-w-0 flex-1 whitespace-pre-wrap t-body-sm text-ink"
                >
                  {bio.trim() ? bio.slice(0, BIO_MAX) : ""}
                </span>
                <SocialIcon name="caret-right" size={16} className="mt-0.5 shrink-0 text-ink-2" />
              </span>
            </Link>
            <div className="h-px bg-hairline" />
            <div data-social-profile-edit-links="" className={SOCIAL_PROFILE_EDIT_ROW_CLASS}>
              <span className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>{SOCIAL.profile.links}</span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="min-w-0 flex-1 t-body-sm text-ink-2">{SOCIAL.profile.addLink}</span>
                <SocialIcon name="caret-right" size={16} className="shrink-0 text-ink-2" />
              </span>
            </div>
          </div>
          {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        </div>
      </div>
    </div>
  );
}
