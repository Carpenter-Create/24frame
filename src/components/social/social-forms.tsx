"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { uploadAccountPhoto } from "@/app/(app)/account/actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { AVATAR_ACCEPT, AVATAR_MAX_BYTES, isAvatarContentType } from "@/lib/account-avatar";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import {
  SOCIAL_ACTION_CLASS,
  SOCIAL_ACTION_SECONDARY_CLASS,
  SOCIAL_CREATE_AVATAR_CLASS,
  SOCIAL_CREATE_CARD_CLASS,
  SOCIAL_CREATE_KIND_CLASS,
  SOCIAL_CREATE_WELL_CLASS,
  SOCIAL_FOLLOW_COMPACT_CLASS,
  SOCIAL_PILL_CLASS,
  SOCIAL_PILL_IDLE_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_CATEGORY_TOPICS } from "@/lib/social-categories";
import {
  SOCIAL_IMAGE_CONTENT_TYPES,
  SOCIAL_MEDIA_ACCEPT,
  SOCIAL_MEDIA_MAX_ITEMS,
  SOCIAL_VIDEO_CONTENT_TYPES,
  type SocialMediaItem,
  type SocialMediaLane,
} from "@/lib/social-media";
import { takeSocialHomeComposerMedia } from "@/lib/social-home-composer";
import {
  displayHandle,
  SOCIAL,
  socialCreateWellCopy,
  socialHandleRequiredError,
  socialInitials,
} from "@/lib/social";
import { cn } from "@/lib/cn";
import { SocialHandleField } from "./social-handle-field";
import { SocialIcon } from "./social-icon";
import {
  addSocialDmPeople,
  createSocialGroup,
  createSocialPost,
  createSocialProfile,
  joinSocialGroup,
  openSocialDm,
  presignSocialMediaUpload,
  sendSocialDm,
  setSocialDmTitle,
  toggleSocialFollow,
  toggleSocialLike,
  updateSocialBio,
} from "@/app/(app)/social/actions";

function FormError({ error }: { error: string }) {
  if (!error) return null;
  return <InlineNotice tone="error">{error}</InlineNotice>;
}

export function SocialProfileCreateForm({
  handle = "",
  displayName = "",
}: {
  handle?: string;
  displayName?: string;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      data-social-profile-form=""
      className="flex max-w-md flex-col gap-[var(--space-4)]"
      action={async (formData) => {
        setPending(true);
        setError("");
        const required = socialHandleRequiredError(String(formData.get("handle") ?? ""));
        if (required) {
          setPending(false);
          setError(required);
          return;
        }
        const result = await createSocialProfile(formData);
        setPending(false);
        if (result.error) setError(result.error);
      }}
    >
      <SocialHandleField id="social-handle" name="handle" defaultHandle={handle} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="social-display-name">{SOCIAL.profile.displayName}</Label>
        <Input
          id="social-display-name"
          name="display_name"
          autoComplete="nickname"
          defaultValue={displayName}
        />
      </div>
      <FormError error={error} />
      <Button type="submit" disabled={pending}>
        {SOCIAL.profile.submit}
      </Button>
    </form>
  );
}

type ComposeKind = "text" | "photo" | "video";

async function uploadSocialMedia(
  files: ArrayLike<File> | null,
  current: SocialMediaItem[],
  max: number,
  lane: SocialMediaLane,
): Promise<{ items?: SocialMediaItem[]; error?: string }> {
  if (!files || files.length === 0) return {};
  const remaining = max - current.length;
  if (remaining <= 0) return { error: SOCIAL.home.mediaLimit };
  const chosen = Array.from(files).slice(0, remaining);
  const next: SocialMediaItem[] = [];
  for (const file of chosen) {
    const body = new FormData();
    body.set("content_type", file.type);
    body.set("byte_length", String(file.size));
    body.set("lane", lane);
    const signed = await presignSocialMediaUpload(body);
    if (signed.error || !signed.url || !signed.key || !signed.kind || !signed.contentType) {
      return { error: signed.error ?? SOCIAL.home.uploadFailed };
    }
    const put = await fetch(signed.url, {
      method: "PUT",
      headers: { "Content-Type": signed.contentType },
      body: file,
    });
    if (!put.ok) return { error: SOCIAL.home.uploadFailed };
    next.push({
      kind: signed.kind as SocialMediaItem["kind"],
      key: signed.key,
      contentType: signed.contentType as SocialMediaItem["contentType"],
    });
  }
  return { items: next };
}

export function SocialPostCompose({
  groupId,
  groupSlug,
}: {
  groupId?: string;
  groupSlug?: string;
}) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<SocialMediaItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(files: ArrayLike<File> | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    const result = await uploadSocialMedia(files, media, SOCIAL_MEDIA_MAX_ITEMS, "posts");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.items) setMedia((current) => [...current, ...result.items!]);
  }

  return (
    <form
      data-social-post-form=""
      className="flex flex-col gap-[var(--space-3)]"
      action={async (formData) => {
        setError("");
        formData.set("media", JSON.stringify(media));
        const result = await createSocialPost(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        setBody("");
        setMedia([]);
      }}
    >
      {groupId ? <input type="hidden" name="group_id" value={groupId} /> : null}
      {groupSlug ? <input type="hidden" name="group_slug" value={groupSlug} /> : null}
      <label className="sr-only" htmlFor="social-post-body">
        {SOCIAL.home.compose}
      </label>
      <textarea
        id="social-post-body"
        name="body"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={SOCIAL.home.compose}
        className="w-full rounded-[var(--radius)] border border-hairline bg-surface px-3 py-2 t-body text-ink outline-none placeholder:text-ink-3 focus:border-accent"
      />
      {media.length > 0 ? (
        <ul data-social-post-attachments="" className="flex flex-col gap-1">
          {media.map((item) => (
            <li key={item.key} className="flex items-center gap-[var(--space-2)] t-body-sm text-ink-2">
              <span>{item.kind === "video" ? SOCIAL.home.videoKind : SOCIAL.home.photoKind}</span>
              <button
                type="button"
                className={TEXT_ACTION_CLASS}
                onClick={() => setMedia((current) => current.filter((row) => row.key !== item.key))}
              >
                {SOCIAL.home.removeAttach}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-center gap-[var(--space-3)]">
        <button
          type="button"
          className={TEXT_ACTION_CLASS}
          disabled={uploading || media.length >= SOCIAL_MEDIA_MAX_ITEMS}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? SOCIAL.home.attaching : SOCIAL.home.attach}
        </button>
        <input
          ref={fileRef}
          id="social-post-media"
          type="file"
          accept={SOCIAL_MEDIA_ACCEPT}
          multiple
          className="sr-only"
          aria-label={SOCIAL.home.attach}
          onChange={(e) => void onPick(e.target.files)}
        />
        <Button type="submit" disabled={uploading}>
          {SOCIAL.home.submit}
        </Button>
      </div>
      <FormError error={error} />
    </form>
  );
}

const CREATE_KIND_ICONS = {
  photo: "image",
  video: "film-strip",
  text: "text-t",
} as const;

export function SocialCreateCompose({
  authorName = SOCIAL.home.you,
  authorHandle = null,
  authorPhotoUrl = null,
  initialKind = null,
}: {
  authorName?: string;
  authorHandle?: string | null;
  authorPhotoUrl?: string | null;
  initialKind?: ComposeKind | null;
}) {
  const [homeMedia] = useState(takeSocialHomeComposerMedia);
  const ingestHomeMedia = homeMedia.length > 0 && (initialKind ?? "photo") !== "text";
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(ingestHomeMedia);
  const [kind, setKind] = useState<ComposeKind>(initialKind ?? "photo");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<SocialMediaItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const accept =
    kind === "photo"
      ? SOCIAL_IMAGE_CONTENT_TYPES.join(",")
      : kind === "video"
        ? SOCIAL_VIDEO_CONTENT_TYPES.join(",")
        : SOCIAL_MEDIA_ACCEPT;
  const well = socialCreateWellCopy(kind, media.length > 0);

  useEffect(() => {
    if (!ingestHomeMedia) return;
    let cancelled = false;
    void uploadSocialMedia(homeMedia, [], SOCIAL_MEDIA_MAX_ITEMS, "posts").then((result) => {
      if (cancelled) return;
      setUploading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.items) setMedia(result.items);
    });
    return () => {
      cancelled = true;
    };
  }, [homeMedia, ingestHomeMedia]);

  async function onPick(files: ArrayLike<File> | null) {
    if (!files || files.length === 0 || kind === "text") return;
    setError("");
    setUploading(true);
    const result = await uploadSocialMedia(files, media, SOCIAL_MEDIA_MAX_ITEMS, "posts");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.items) setMedia((current) => [...current, ...result.items!]);
  }

  return (
    <form
      data-social-create-form=""
      className={SOCIAL_CREATE_CARD_CLASS}
      action={async (formData) => {
        setError("");
        formData.set("media", JSON.stringify(media));
        const result = await createSocialPost(formData);
        if (result?.error) setError(result.error);
      }}
    >
      <div className="flex items-center gap-3" data-social-create-author="">
        <span className={SOCIAL_CREATE_AVATAR_CLASS}>
          {authorPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the private avatars bucket
            <img src={authorPhotoUrl} alt="" className="size-full object-cover" />
          ) : (
            socialInitials(authorName)
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate t-body-sm font-semibold text-ink md:t-body">{authorName}</span>
          {authorHandle ? (
            <span className="block truncate text-[11px] text-ink-2 md:text-[12px]">{displayHandle(authorHandle)}</span>
          ) : null}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 md:gap-2" data-social-create-kinds="">
        {(["photo", "video", "text"] as const).map((value) => {
          const active = kind === value;
          return (
            <button
              key={value}
              type="button"
              data-social-create-kind={value}
              data-social-create-kind-active={active ? "" : undefined}
              className={cn(
                SOCIAL_CREATE_KIND_CLASS,
                active ? "bg-accent font-semibold text-accent-contrast" : "bg-surface-muted font-medium text-ink",
              )}
              onClick={() => setKind(value)}
            >
              <SocialIcon
                name={CREATE_KIND_ICONS[value]}
                size={16}
                className={active ? "text-accent-contrast" : "text-ink-2"}
              />
              {value === "text" ? SOCIAL.create.text : value === "photo" ? SOCIAL.create.photo : SOCIAL.create.video}
            </button>
          );
        })}
      </div>
      {well ? (
        <button
          type="button"
          data-social-create-well=""
          disabled={uploading || media.length >= SOCIAL_MEDIA_MAX_ITEMS}
          onClick={() => fileRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            void onPick(event.dataTransfer.files);
          }}
          className={SOCIAL_CREATE_WELL_CLASS}
        >
          <SocialIcon
            name={kind === "video" ? "film-strip" : "image"}
            size={40}
            className="text-ink-2"
          />
          <span className="t-body-sm font-semibold text-ink md:t-body">
            {uploading ? SOCIAL.home.attaching : well.title}
          </span>
          <span className="t-label text-ink-2 md:t-body-sm">{well.hint}</span>
        </button>
      ) : null}
      {kind === "text" ? null : (
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          aria-label={SOCIAL.home.attach}
          onChange={(e) => void onPick(e.target.files)}
        />
      )}
      {media.length > 0 ? (
        <ul data-social-post-attachments="" className="flex flex-col gap-1">
          {media.map((item) => (
            <li key={item.key} className="flex items-center gap-[var(--space-2)] t-body-sm text-ink-2">
              <span>{item.kind === "video" ? SOCIAL.home.videoKind : SOCIAL.home.photoKind}</span>
              <button
                type="button"
                className={TEXT_ACTION_CLASS}
                onClick={() => setMedia((current) => current.filter((row) => row.key !== item.key))}
              >
                {SOCIAL.home.removeAttach}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-col gap-1.5 md:gap-2">
        <label className="t-label font-medium text-ink-2 md:t-body-sm" htmlFor="social-create-body">
          {SOCIAL.create.caption}
        </label>
        <textarea
          id="social-create-body"
          name="body"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={SOCIAL.home.captionPlaceholder}
          className="h-20 w-full rounded-[8px] border border-hairline bg-surface px-3 py-3 t-body-sm text-ink outline-none placeholder:text-ink-2 focus:border-accent md:h-24 md:px-[14px] md:t-body"
        />
      </div>
      <div className="sr-only">
        <Label htmlFor="social-create-category">{SOCIAL.home.topic}</Label>
        <select id="social-create-category" name="category" defaultValue="">
          <option value=""></option>
          {SOCIAL_CATEGORY_TOPICS.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 t-body-sm text-ink-2">
          <span className="hidden md:inline">{SOCIAL.home.audience}</span>
          <span className={cn(SOCIAL_PILL_CLASS, SOCIAL_PILL_IDLE_CLASS, "inline-flex items-center gap-1.5")}>
            <SocialIcon name="users" size={14} className="text-ink-2" />
            {SOCIAL.home.audienceFollowing}
          </span>
        </p>
        <button type="submit" disabled={uploading} className={SOCIAL_ACTION_CLASS}>
          {SOCIAL.home.submit}
        </button>
      </div>
      <FormError error={error} />
    </form>
  );
}

export { SocialStoryCompose } from "./social-story-studio";

export function SocialProfilePhotoForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

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

  return (
    <div data-social-profile-photo="" className="flex flex-col gap-[var(--space-2)]">
      <button
        type="button"
        className={TEXT_ACTION_CLASS}
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? SOCIAL.profile.uploadingPhoto : SOCIAL.profile.uploadPhoto}
      </button>
      <input
        ref={fileRef}
        id="social-profile-photo"
        type="file"
        accept={AVATAR_ACCEPT}
        className="sr-only"
        aria-label={SOCIAL.profile.uploadPhoto}
        onChange={(e) => void onPick(e.target.files?.[0])}
      />
      <FormError error={error} />
    </div>
  );
}

export function SocialBioForm({ bio }: { bio: string }) {
  const [error, setError] = useState("");
  return (
    <form
      data-social-bio-form=""
      className="flex max-w-md flex-col gap-[var(--space-3)]"
      action={async (formData) => {
        setError("");
        const result = await updateSocialBio(formData);
        if (result.error) setError(result.error);
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="social-bio">{SOCIAL.profile.bio}</Label>
        <textarea
          id="social-bio"
          name="bio"
          rows={3}
          defaultValue={bio}
          className="w-full rounded-[var(--radius)] border border-hairline bg-surface px-3 py-2 t-body text-ink outline-none placeholder:text-ink-3 focus:border-accent"
        />
      </div>
      <FormError error={error} />
      <Button type="submit" variant="secondary">
        {SOCIAL.profile.bioSubmit}
      </Button>
    </form>
  );
}

export function SocialFollowButton({
  followeeId,
  handle,
  following,
  compact = false,
  stretch = false,
}: {
  followeeId: string;
  handle: string;
  following: boolean;
  compact?: boolean;
  stretch?: boolean;
}) {
  return (
    <form
      data-social-follow=""
      className={stretch ? "min-w-0 flex-1 md:flex-none" : undefined}
      action={async (formData) => {
        await toggleSocialFollow(formData);
      }}
    >
      <input type="hidden" name="followee_id" value={followeeId} />
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="following" value={following ? "1" : "0"} />
      <button
        type="submit"
        className={
          compact
            ? SOCIAL_FOLLOW_COMPACT_CLASS
            : cn(
                following ? SOCIAL_ACTION_SECONDARY_CLASS : SOCIAL_ACTION_CLASS,
                stretch && "w-full",
              )
        }
      >
        {following ? SOCIAL.follow.following : SOCIAL.follow.follow}
      </button>
    </form>
  );
}

export function SocialLikeButton({
  postId,
  liked,
  likeCount,
  groupSlug,
  disabled,
  icon = false,
}: {
  postId: string;
  liked: boolean;
  likeCount: number;
  groupSlug?: string;
  disabled?: boolean;
  icon?: boolean;
}) {
  return (
    <form
      action={async (formData) => {
        await toggleSocialLike(formData);
      }}
      className="inline"
    >
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="liked" value={liked ? "1" : "0"} />
      {groupSlug ? <input type="hidden" name="group_slug" value={groupSlug} /> : null}
      <button
        type="submit"
        disabled={disabled}
        data-social-like=""
        aria-label={liked ? SOCIAL.post.unlike : SOCIAL.post.like}
        className={icon ? "text-ink" : "t-body-sm text-ink-2"}
      >
        {icon ? (
          <SocialIcon name="heart" active={liked} size={22} />
        ) : (
          <>
            {likeCount} {SOCIAL.post.likes}
          </>
        )}
      </button>
    </form>
  );
}

export function SocialJoinGroupButton({
  groupId,
  groupSlug,
}: {
  groupId: string;
  groupSlug: string;
}) {
  const [error, setError] = useState("");
  return (
    <form
      action={async (formData) => {
        setError("");
        const result = await joinSocialGroup(formData);
        if (result.error) setError(result.error);
      }}
    >
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="group_slug" value={groupSlug} />
      <Button type="submit" variant="secondary">
        {SOCIAL.groups.join}
      </Button>
      <FormError error={error} />
    </form>
  );
}

export function SocialGroupCreateForm() {
  const [error, setError] = useState("");
  return (
    <form
      data-social-group-form=""
      className="flex max-w-md flex-col gap-[var(--space-4)]"
      action={async (formData) => {
        setError("");
        const result = await createSocialGroup(formData);
        if (result?.error) setError(result.error);
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="social-group-name">{SOCIAL.groupNew.name}</Label>
        <Input id="social-group-name" name="name" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="social-group-slug">{SOCIAL.groupNew.slug}</Label>
        <Input id="social-group-slug" name="slug" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="social-group-description">{SOCIAL.groupNew.description}</Label>
        <textarea
          id="social-group-description"
          name="description"
          rows={3}
          className="w-full rounded-[var(--radius)] border border-hairline bg-surface px-3 py-2 t-body text-ink outline-none placeholder:text-ink-3 focus:border-accent"
        />
      </div>
      <FormError error={error} />
      <Button type="submit">{SOCIAL.groupNew.submit}</Button>
    </form>
  );
}

export function SocialStoryReply({ peerId }: { peerId: string }) {
  const [error, setError] = useState("");
  return (
    <form
      data-social-story-reply=""
      className="flex min-w-0 flex-1 flex-col gap-1"
      action={async (formData) => {
        setError("");
        const result = await openSocialDm(formData);
        if (result?.error) setError(result.error);
      }}
    >
      <input type="hidden" name="peer_id" value={peerId} />
      <button
        type="submit"
        className="w-full rounded-full border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-2)] text-left t-body-sm text-ink-3"
      >
        {SOCIAL.stories.reply}
      </button>
      <FormError error={error} />
    </form>
  );
}

export function SocialMessageButton({ peerId }: { peerId: string }) {
  const [error, setError] = useState("");
  return (
    <form
      data-social-open-dm=""
      action={async (formData) => {
        setError("");
        const result = await openSocialDm(formData);
        if (result?.error) setError(result.error);
      }}
    >
      <input type="hidden" name="peer_id" value={peerId} />
      <Button type="submit">{SOCIAL.member.message}</Button>
      <FormError error={error} />
    </form>
  );
}

export function SocialDmCompose({ conversationId }: { conversationId: string }) {
  const [error, setError] = useState("");
  return (
    <form
      data-social-dm-form=""
      className="flex flex-col gap-[var(--space-3)]"
      action={async (formData) => {
        setError("");
        const result = await sendSocialDm(formData);
        if (result?.error) setError(result.error);
      }}
    >
      <input type="hidden" name="conversation_id" value={conversationId} />
      <label className="sr-only" htmlFor="social-dm-body">
        {SOCIAL.dms.compose}
      </label>
      <textarea
        id="social-dm-body"
        name="body"
        rows={3}
        required
        placeholder={SOCIAL.dms.compose}
        className="w-full rounded-[var(--radius)] border border-hairline bg-surface px-3 py-2 t-body text-ink outline-none placeholder:text-ink-3 focus:border-accent"
      />
      <FormError error={error} />
      <Button type="submit">{SOCIAL.dms.submit}</Button>
    </form>
  );
}

export function SocialAddPeopleForm({ conversationId }: { conversationId: string }) {
  const [error, setError] = useState("");
  return (
    <form
      data-social-add-people=""
      className="flex max-w-md flex-col gap-[var(--space-3)]"
      action={async (formData) => {
        setError("");
        const result = await addSocialDmPeople(formData);
        if (result.error) setError(result.error);
      }}
    >
      <input type="hidden" name="conversation_id" value={conversationId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="social-add-handles">{SOCIAL.dms.addPeople}</Label>
        <Input
          id="social-add-handles"
          name="handles"
          autoComplete="off"
          required
          placeholder={SOCIAL.dms.addHandle}
        />
      </div>
      <FormError error={error} />
      <Button type="submit" variant="secondary">
        {SOCIAL.dms.addSubmit}
      </Button>
    </form>
  );
}

export function SocialGroupTitleForm({
  conversationId,
  title,
}: {
  conversationId: string;
  title: string | null;
}) {
  const [error, setError] = useState("");
  return (
    <form
      data-social-group-title=""
      className="flex max-w-md flex-col gap-[var(--space-3)]"
      action={async (formData) => {
        setError("");
        const result = await setSocialDmTitle(formData);
        if (result.error) setError(result.error);
      }}
    >
      <input type="hidden" name="conversation_id" value={conversationId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="social-dm-title">{SOCIAL.dms.titleLabel}</Label>
        <Input
          id="social-dm-title"
          name="title"
          defaultValue={title ?? ""}
          autoComplete="off"
        />
        <p className="t-body-sm text-ink-3">{SOCIAL.dms.titleHint}</p>
      </div>
      <FormError error={error} />
      <Button type="submit" variant="secondary">
        {SOCIAL.dms.titleSave}
      </Button>
    </form>
  );
}
