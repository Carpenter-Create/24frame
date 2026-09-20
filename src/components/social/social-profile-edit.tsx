"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { uploadAccountPhoto } from "@/app/(app)/account/actions";
import {
  clearSocialWelcomeVideo,
  createSocialProfile,
  presignSocialMediaUpload,
  saveSocialWelcomeVideo,
} from "@/app/(app)/social/actions";
import { AccountAvatarCrop } from "@/components/account/account-avatar-crop";
import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialProfileBioEditor } from "@/components/social/social-profile-bio";
import { SocialIcon } from "@/components/social/social-icon";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { cropAvatarFile, type AvatarCropFrame } from "@/lib/account-avatar-crop";
import { AVATAR_ACCEPT, AVATAR_MAX_BYTES, isAvatarContentType } from "@/lib/account-avatar";
import { SOCIAL_VIDEO_CONTENT_TYPES } from "@/lib/social-media";
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
  composeSocialDisplayName,
  handleFieldValue,
  normalizeHandle,
  socialHandleRequiredError,
  socialNameRequiredError,
  socialProfilePublicUrl,
  splitSocialDisplayName,
  stripHandleDecorators,
} from "@/lib/social";
import { socialProfileEditFace, type SocialProfileEditFace } from "@/lib/social-profile-edit";

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
  welcomeVideoUrl = null,
}: {
  handle: string;
  displayName: string;
  bio: string;
  photoUrl: string | null;
  welcomeVideoUrl?: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const welcomeRef = useRef<HTMLInputElement>(null);
  const split = splitSocialDisplayName(displayName);
  const [firstName, setFirstName] = useState(split.firstName);
  const [middleName, setMiddleName] = useState(split.middleName);
  const [lastName, setLastName] = useState(split.lastName);
  const [username, setUsername] = useState(handleFieldValue(handle));
  const [error, setError] = useState("");
  const [handleError, setHandleError] = useState("");
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPreview, setCropPreview] = useState<string | null>(null);
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | null>(null);
  const [face, setFace] = useState<SocialProfileEditFace>("edit");
  const [bioText, setBioText] = useState(bio);
  const preview = socialProfilePublicUrl(bareHandle(username));
  const required = socialHandleRequiredError(username);

  function applyHandle(raw: string) {
    setUsername(`@${stripHandleDecorators(raw)}`);
    setHandleError("");
  }

  function clearCrop() {
    if (cropPreview) URL.revokeObjectURL(cropPreview);
    setCropFile(null);
    setCropPreview(null);
    setCropSize(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function beginCrop(file: File | undefined) {
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
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      if (cropPreview) URL.revokeObjectURL(cropPreview);
      setCropFile(file);
      setCropPreview(url);
      setCropSize({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError(ACCOUNT_PROFILE.photoType);
    };
    image.src = url;
  }

  async function onCropConfirm(frame: AvatarCropFrame) {
    if (!cropFile) return;
    setUploading(true);
    setError("");
    try {
      const cropped = await cropAvatarFile(cropFile, frame);
      const body = new FormData();
      body.set("photo", cropped);
      const res = await uploadAccountPhoto(body);
      if (res.error) {
        setError(res.error);
        return;
      }
      clearCrop();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : ACCOUNT_PROFILE.photoFailed);
    } finally {
      setUploading(false);
    }
  }

  async function onWelcomePick(file: File | undefined) {
    if (!file) return;
    setError("");
    setUploading(true);
    const body = new FormData();
    body.set("content_type", file.type);
    body.set("byte_length", String(file.size));
    body.set("lane", "posts");
    const signed = await presignSocialMediaUpload(body);
    if (signed.error || !signed.url || !signed.key || !signed.kind || !signed.contentType) {
      setUploading(false);
      if (welcomeRef.current) welcomeRef.current.value = "";
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
      if (welcomeRef.current) welcomeRef.current.value = "";
      setError(SOCIAL.home.uploadFailed);
      return;
    }
    const save = new FormData();
    save.set(
      "media",
      JSON.stringify([{ kind: signed.kind, key: signed.key, contentType: signed.contentType }]),
    );
    const result = await saveSocialWelcomeVideo(save);
    setUploading(false);
    if (welcomeRef.current) welcomeRef.current.value = "";
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function onWelcomeRemove() {
    setError("");
    setUploading(true);
    const result = await clearSocialWelcomeVideo();
    setUploading(false);
    if (result.error) {
      setError(result.error);
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
    if (!normalizeHandle(username)) {
      setHandleError(SOCIAL.profile.handleInvalid);
      return;
    }
    const nameError = socialNameRequiredError(firstName, lastName);
    if (nameError) {
      setError(nameError);
      return;
    }
    setPending(true);
    const form = new FormData();
    form.set("handle", username);
    form.set("first_name", firstName);
    form.set("middle_name", middleName);
    form.set("last_name", lastName);
    form.set("display_name", composeSocialDisplayName(firstName, lastName, middleName));
    const result = await createSocialProfile(form);
    setPending(false);
    if (result.error) {
      if (
        result.error === SOCIAL.profile.handleRequired ||
        result.error === SOCIAL.profile.handleInvalid ||
        result.error === SOCIAL.profile.handleTaken
      ) {
        setHandleError(result.error);
      } else {
        setError(result.error);
      }
      return;
    }
    router.push(SOCIAL_ROUTES.profile);
  }

  if (face === "bio") {
    return (
      <SocialProfileBioEditor
        bio={bioText}
        onBack={() => setFace(socialProfileEditFace(false))}
        onSaved={(next) => {
          setBioText(next);
          setFace(socialProfileEditFace(false));
        }}
      />
    );
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
            {cropFile && cropPreview && cropSize ? (
              <AccountAvatarCrop
                previewUrl={cropPreview}
                imageWidth={cropSize.width}
                imageHeight={cropSize.height}
                pending={uploading}
                onCancel={clearCrop}
                onConfirm={(frame) => void onCropConfirm(frame)}
              />
            ) : (
              <>
                <button
                  type="button"
                  disabled={uploading}
                  data-social-profile-edit-avatar-drop=""
                  aria-label={SOCIAL.profile.editPicture}
                  className={SOCIAL_PROFILE_EDIT_AVATAR_CLASS}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropping(true);
                  }}
                  onDragLeave={() => setDropping(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDropping(false);
                    beginCrop(event.dataTransfer.files[0]);
                  }}
                >
                  <SocialAvatar
                    name={composeSocialDisplayName(firstName, lastName, middleName)}
                    photoUrl={photoUrl}
                    size="profile"
                    className="size-full"
                  />
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className={SOCIAL_PROFILE_EDIT_PICTURE_CLASS}
                >
                  {dropping ? ACCOUNT_PROFILE.dropPhoto : uploading ? SOCIAL.profile.uploadingPhoto : SOCIAL.profile.editPicture}
                </button>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="sr-only"
              aria-label={SOCIAL.profile.editPicture}
              onChange={(e) => beginCrop(e.target.files?.[0])}
            />
          </div>
          <div data-social-profile-edit-welcome="" className={SOCIAL_PROFILE_EDIT_CARD_CLASS}>
            <div className={`${SOCIAL_PROFILE_EDIT_ROW_CLASS} flex-col gap-2`}>
              <p className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>{SOCIAL.profile.welcomeVideo}</p>
              {welcomeVideoUrl ? (
                <video
                  src={welcomeVideoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full bg-surface-muted object-contain"
                />
              ) : null}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => welcomeRef.current?.click()}
                  className={SOCIAL_PROFILE_EDIT_PICTURE_CLASS}
                >
                  {welcomeVideoUrl ? SOCIAL.profile.welcomeReplace : SOCIAL.profile.welcomeAdd}
                </button>
                {welcomeVideoUrl ? (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => void onWelcomeRemove()}
                    className="t-body-sm font-medium text-ink-2"
                  >
                    {SOCIAL.profile.welcomeRemove}
                  </button>
                ) : null}
              </div>
              <input
                ref={welcomeRef}
                type="file"
                accept={SOCIAL_VIDEO_CONTENT_TYPES.join(",")}
                className="sr-only"
                aria-label={SOCIAL.profile.welcomeAdd}
                onChange={(e) => void onWelcomePick(e.target.files?.[0])}
              />
            </div>
          </div>
          <div data-social-profile-edit-fields="" className={SOCIAL_PROFILE_EDIT_CARD_CLASS}>
            <div data-social-profile-edit-names="" className="flex flex-col">
              <div className={`${SOCIAL_PROFILE_EDIT_ROW_CLASS} flex-col gap-2 md:flex-row`}>
                <label htmlFor="social-edit-first-name" className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
                  {SOCIAL.profile.firstName}
                </label>
                <Input
                  variant="bare"
                  id="social-edit-first-name"
                  name="first_name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="min-w-0 flex-1"
                />
              </div>
              <div className="h-px bg-hairline" />
              <div className={`${SOCIAL_PROFILE_EDIT_ROW_CLASS} flex-col gap-2 md:flex-row`}>
                <label htmlFor="social-edit-middle-name" className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
                  {SOCIAL.profile.middleName}
                </label>
                <Input
                  variant="bare"
                  id="social-edit-middle-name"
                  name="middle_name"
                  autoComplete="additional-name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="min-w-0 flex-1"
                />
              </div>
              <div className="h-px bg-hairline" />
              <div className={`${SOCIAL_PROFILE_EDIT_ROW_CLASS} flex-col gap-2 md:flex-row`}>
                <label htmlFor="social-edit-last-name" className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
                  {SOCIAL.profile.lastName}
                </label>
                <Input
                  variant="bare"
                  id="social-edit-last-name"
                  name="last_name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="min-w-0 flex-1"
                />
              </div>
            </div>
            <div className="h-px bg-hairline" />
            <div data-social-handle-field="" className="flex flex-col gap-2 py-4">
              <div className="flex items-start gap-4">
                <label htmlFor="social-edit-handle" className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
                  {SOCIAL.profile.username}
                </label>
                <div className={handleError ? SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS : SOCIAL_PROFILE_EDIT_HANDLE_CLASS}>
                  <span className="font-medium text-ink-2">@</span>
                  <Input
                    variant="bare"
                    id="social-edit-handle"
                    name="handle"
                    autoComplete="username"
                    value={bareHandle(username)}
                    placeholder={SOCIAL.profile.usernamePlaceholder}
                    onChange={(e) => applyHandle(e.target.value)}
                    className="flex-1 placeholder:text-ink-2"
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
            <button
              type="button"
              data-social-profile-edit-bio-open=""
              onClick={() => setFace(socialProfileEditFace(true))}
              className={`${SOCIAL_PROFILE_EDIT_ROW_CLASS} text-left`}
            >
              <span className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>{SOCIAL.profile.bio}</span>
              <span className="flex min-w-0 flex-1 items-start gap-2">
                <span
                  data-social-profile-edit-bio=""
                  className="min-w-0 flex-1 whitespace-pre-wrap t-body-sm text-ink"
                >
                  {bioText.trim() ? bioText.slice(0, BIO_MAX) : ""}
                </span>
                <SocialIcon name="caret-right" size={16} className="mt-0.5 shrink-0 text-ink-2" />
              </span>
            </button>
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
