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
import { SocialProfileRolesField } from "@/components/social/social-profile-roles";
import { SocialProfileTopicsField } from "@/components/social/social-profile-topics";
import { SocialIcon } from "@/components/social/social-icon";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import {
  accountAvatarPickError,
  cropAvatarFile,
  readAccountAvatarCropPreview,
  type AvatarCropFrame,
} from "@/lib/account-avatar-crop";
import { AVATAR_ACCEPT } from "@/lib/account-avatar";
import { cn } from "@/lib/cn";
import { SOCIAL_VIDEO_CONTENT_TYPES } from "@/lib/social-media";
import {
  SOCIAL_PROFILE_EDIT_AVATAR_CLASS,
  SOCIAL_PROFILE_EDIT_AVATAR_DROPPING_CLASS,
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
  SOCIAL_PROFILE_EDIT_SECTION_CLASS,
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
import {
  SOCIAL_PROFILE_LINKS_MAX,
  composeSocialWebsiteUrlField,
  parseSocialWebsiteUrlField,
} from "@/lib/social-profile-links";
import { parseSocialProfileRoles } from "@/lib/social-profile-roles";
import { parseSocialProfileTopics } from "@/lib/social-profile-topics";
import { socialProfileEditFace, type SocialProfileEditFace } from "@/lib/social-profile-edit";
import { useAppQueryClient } from "@/components/query-provider";
import {
  applyOptimisticSocialProfile,
  applyOptimisticSocialProfilePatch,
  invalidateSocialQueries,
} from "@/lib/social-query";

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
  profileId,
  handle,
  displayName,
  bio,
  photoUrl,
  welcomeVideoUrl = null,
  crafts = [],
  topics = [],
  imdbUrl = "",
  websiteUrl = "",
}: {
  profileId?: string;
  handle: string;
  displayName: string;
  bio: string;
  photoUrl: string | null;
  welcomeVideoUrl?: string | null;
  crafts?: readonly string[];
  topics?: readonly string[];
  imdbUrl?: string | null;
  websiteUrl?: string | null;
}) {
  const router = useRouter();
  const queryClient = useAppQueryClient();
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
  const [roles, setRoles] = useState(() => parseSocialProfileRoles(crafts));
  const [interestTopics, setInterestTopics] = useState(() => parseSocialProfileTopics(topics));
  const [imdb, setImdb] = useState(imdbUrl ?? "");
  const [linkDrafts, setLinkDrafts] = useState(() => {
    const urls = parseSocialWebsiteUrlField(websiteUrl);
    return urls.length > 0 ? urls : [""];
  });
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
    const pickError = accountAvatarPickError(file);
    if (!file) return;
    setError("");
    if (pickError) {
      setError(pickError);
      return;
    }
    void readAccountAvatarCropPreview(file)
      .then((next) => {
        if (cropPreview) URL.revokeObjectURL(cropPreview);
        setCropFile(file);
        setCropPreview(next.url);
        setCropSize({ width: next.width, height: next.height });
      })
      .catch((cause) => {
        setError(cause instanceof Error && cause.message ? cause.message : ACCOUNT_PROFILE.photoType);
      });
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
    form.set("crafts", JSON.stringify(roles));
    form.set("topics", JSON.stringify(interestTopics));
    form.set("imdb_url", imdb);
    form.set("links", JSON.stringify(linkDrafts));
    const nextHandle = normalizeHandle(username) ?? username;
    const nextName = composeSocialDisplayName(firstName, lastName, middleName);
    if (queryClient && profileId) {
      applyOptimisticSocialProfile(queryClient, {
        id: profileId,
        handle: nextHandle,
        display_name: nextName,
        status: "active",
        bio: bioText,
        crafts: roles,
        topics: interestTopics,
        imdb_url: imdb.trim() || null,
        website_url: composeSocialWebsiteUrlField(linkDrafts.filter(Boolean)),
      });
    }
    const result = await createSocialProfile(form);
    setPending(false);
    if (result.error) {
      if (queryClient && profileId) invalidateSocialQueries(queryClient, { profileId });
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
        profileId={profileId}
        bio={bioText}
        onBack={() => setFace(socialProfileEditFace(false))}
        onSaved={(next) => {
          setBioText(next);
          if (queryClient && profileId) {
            applyOptimisticSocialProfilePatch(queryClient, profileId, { bio: next || null });
          }
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
                key={cropPreview}
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
                  data-dropping={dropping ? "" : undefined}
                  aria-label={dropping ? ACCOUNT_PROFILE.dropPhoto : SOCIAL.profile.editPicture}
                  className={cn(
                    SOCIAL_PROFILE_EDIT_AVATAR_CLASS,
                    dropping ? SOCIAL_PROFILE_EDIT_AVATAR_DROPPING_CLASS : null,
                  )}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
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
                  {dropping
                    ? ACCOUNT_PROFILE.dropPhoto
                    : uploading
                      ? SOCIAL.profile.uploadingPhoto
                      : SOCIAL.profile.editPicture}
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
              <div className={cn(SOCIAL_PROFILE_EDIT_ROW_CLASS, "flex-col gap-2 md:flex-row md:gap-3")}>
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
              <div className={cn(SOCIAL_PROFILE_EDIT_ROW_CLASS, "flex-col gap-2 md:flex-row md:gap-3")}>
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
              <div className={cn(SOCIAL_PROFILE_EDIT_ROW_CLASS, "flex-col gap-2 md:flex-row md:gap-3")}>
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
            <div data-social-handle-field="" className={SOCIAL_PROFILE_EDIT_SECTION_CLASS}>
              <div className="flex items-start gap-3">
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
            <SocialProfileRolesField value={roles} onChange={setRoles} />
            <div className="h-px bg-hairline" />
            <SocialProfileTopicsField value={interestTopics} onChange={setInterestTopics} />
            <div className="h-px bg-hairline" />
            <div data-social-profile-edit-imdb="" className={cn(SOCIAL_PROFILE_EDIT_ROW_CLASS, "flex-col gap-2 md:flex-row md:gap-3")}>
              <label htmlFor="social-edit-imdb" className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
                {SOCIAL.profile.imdb}
              </label>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Input
                  variant="bare"
                  id="social-edit-imdb"
                  name="imdb_url"
                  value={imdb}
                  placeholder={SOCIAL.profile.imdbPlaceholder}
                  onChange={(e) => setImdb(e.target.value)}
                  className="min-w-0 flex-1"
                  autoComplete="url"
                />
                <p className="t-label text-ink-2">{SOCIAL.profile.imdbHint}</p>
              </div>
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
            <div data-social-profile-edit-links="" className={SOCIAL_PROFILE_EDIT_SECTION_CLASS}>
              <span className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>{SOCIAL.profile.links}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {linkDrafts.map((value, index) => (
                  <div
                    key={`social-edit-link-${index}`}
                    className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <Input
                      variant="bare"
                      id={index === 0 ? "social-edit-link-0" : undefined}
                      value={value}
                      placeholder={SOCIAL.profile.linkPlaceholder}
                      onChange={(e) => {
                        const next = [...linkDrafts];
                        next[index] = e.target.value;
                        setLinkDrafts(next);
                      }}
                      className="min-w-0 flex-1"
                      autoComplete="url"
                    />
                    {linkDrafts.length > 1 ? (
                      <button
                        type="button"
                        data-social-profile-edit-link-remove=""
                        onClick={() => setLinkDrafts(linkDrafts.filter((_, i) => i !== index))}
                        className="t-label text-ink-2"
                      >
                        {SOCIAL.profile.removeLink}
                      </button>
                    ) : null}
                  </div>
                ))}
                {linkDrafts.length < SOCIAL_PROFILE_LINKS_MAX ? (
                  <button
                    type="button"
                    data-social-profile-edit-link-add=""
                    onClick={() => setLinkDrafts([...linkDrafts, ""])}
                    className="self-start t-body-sm font-medium text-ink"
                  >
                    {SOCIAL.profile.addLink}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        </div>
      </div>
    </div>
  );
}
