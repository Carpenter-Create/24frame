"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InlineNotice } from "@/components/ui/inline-notice";
import { uploadAccountPhoto } from "@/app/(app)/account/actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { AVATAR_ACCEPT, AVATAR_MAX_BYTES, isAvatarContentType } from "@/lib/account-avatar";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import {
  DM_THREAD_COMPOSER_CAMERA_CLASS,
  DM_THREAD_COMPOSER_CAMERA_GLYPH,
  DM_THREAD_COMPOSER_CLASS,
  DM_THREAD_COMPOSER_FIELD_CLASS,
  DM_THREAD_COMPOSER_ROW_CLASS,
  DM_THREAD_COMPOSER_SEND_CLASS,
} from "@/lib/social-dm-thread-format";
import {
  SOCIAL_ACTION_CLASS,
  SOCIAL_CREATE_AVATAR_CLASS,
  SOCIAL_PERSON_PRIMARY_CLASS,
  SOCIAL_PERSON_SECONDARY_CLASS,
  SOCIAL_CREATE_CARD_CLASS,
  SOCIAL_PILL_CLASS,
  SOCIAL_PILL_IDLE_CLASS,
  SOCIAL_STORY_REPLY_PILL_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_CATEGORY_TOPICS } from "@/lib/social-categories";
import {
  SOCIAL_MEDIA_ACCEPT,
  SOCIAL_MEDIA_MAX_ITEMS,
  socialMediaKindFor,
  type SocialMediaItem,
} from "@/lib/social-media";
import { uploadSocialPostMedia } from "@/lib/social-media-upload";
import { HouseVoiceMic } from "@/components/chrome/house-voice-mic";
import { HOUSE_VOICE_FIELD_HOST_CLASS } from "@/lib/form-control";
import {
  SOCIAL_CREATE_MEDIA_ACCEPT,
  socialCreateMediaStepAfterPick,
  type SocialCreateMediaStep,
} from "@/lib/social-create-media";
import { takeSocialHomeComposerMedia } from "@/lib/social-home-composer";
import { ingestSpeechLearning } from "@/lib/speech-learning";
import {
  displayHandle,
  SOCIAL,
  SOCIAL_ROUTES,
  socialHandleDisplayError,
  socialHandleInputError,
  type SocialCreateKind,
} from "@/lib/social";
import {
  applyOptimisticSocialPost,
  beginSocialPostPublish,
  beginSocialPostPublishBusy,
  endSocialPostPublishBusy,
  failOptimisticSocialPost,
  persistSocialPost,
  runSocialOptimisticMutation,
} from "@/lib/social-optimistic";
import { cn } from "@/lib/cn";
import { SocialAvatar } from "./social-avatar";
import { SocialHandleField } from "./social-handle-field";
import { SocialIcon } from "./social-icon";
import {
  createSocialGroup,
  createSocialProfile,
  joinSocialGroup,
  openSocialDm,
  sendSocialDm,
  setSocialDmTitle,
  updateSocialBio,
} from "@/app/(app)/social/actions";

export { SocialFollowButton, SocialLikeButton, SocialLikeCount } from "./social-engagement";

function FormError({ error }: { error: string }) {
  if (!error) return null;
  return <InlineNotice tone="error">{error}</InlineNotice>;
}

function persistKeys(media: SocialMediaItem[]) {
  return media.map((item) => ({
    kind: item.kind,
    key: item.key,
    contentType: item.contentType,
    ...(item.provider === "mux" && item.playbackId
      ? {
          provider: "mux" as const,
          playbackId: item.playbackId,
          ...(item.uploadId ? { uploadId: item.uploadId } : {}),
          ...(item.assetId ? { assetId: item.assetId } : {}),
          ...(item.playbackPolicy ? { playbackPolicy: item.playbackPolicy } : {}),
        }
      : {}),
  }));
}

function publishOptimisticPost({
  body,
  media,
  previews,
  authorName,
  authorHandle,
  authorPhotoUrl,
  groupId,
  groupSlug,
  category,
  onLocalSuccess,
  onNavigate,
  onRestore,
  setError,
}: {
  body: string;
  media: SocialMediaItem[];
  previews?: Readonly<Record<string, string>>;
  authorName: string;
  authorHandle?: string | null;
  authorPhotoUrl?: string | null;
  groupId?: string;
  groupSlug?: string;
  category?: string;
  onLocalSuccess?: () => void;
  onNavigate?: () => void;
  onRestore?: () => void;
  setError: (error: string) => void;
}) {
  const started = beginSocialPostPublish({
    body,
    mediaItems: persistKeys(media),
    mediaPreview: media.flatMap((item) => {
      const url = previews?.[item.key] ?? "";
      if (!url && !item.playbackId) return [];
      return [
        {
          kind: item.kind,
          url,
          ...(item.playbackId ? { playbackId: item.playbackId } : {}),
          ...(item.playbackPolicy ? { playbackPolicy: item.playbackPolicy } : {}),
        },
      ];
    }),
    authorName,
    authorHandle,
    authorPhotoUrl,
    groupId,
    groupSlug,
    category,
  });
  if (!started.ok) {
    setError(started.error);
    return;
  }
  if (!beginSocialPostPublishBusy()) return;
  runSocialOptimisticMutation({
    apply: () => {
      applyOptimisticSocialPost(started.post);
      setError("");
      onLocalSuccess?.();
      onNavigate?.();
      return started.post.id;
    },
    persist: () => persistSocialPost(started.form),
    rollback: () => {
      failOptimisticSocialPost(started.post.id, ACCOUNT_PROFILE.saveFailed);
      endSocialPostPublishBusy();
      onRestore?.();
    },
    onError: (error) => {
      failOptimisticSocialPost(started.post.id, error);
      endSocialPostPublishBusy();
      onRestore?.();
      setError(error);
    },
    onSuccess: () => {
      endSocialPostPublishBusy();
    },
  });
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
        const handle = String(formData.get("handle") ?? "");
        const formatError = socialHandleInputError(handle);
        if (formatError) {
          setPending(false);
          setError(formatError);
          return;
        }
        const result = await createSocialProfile(formData);
        setPending(false);
        if (result.error) setError(result.error);
      }}
    >
      <SocialHandleField
        id="social-handle"
        name="handle"
        defaultHandle={handle}
        onValueChange={(next) => {
          setError((prev) => socialHandleDisplayError(next, prev));
        }}
      />
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

async function uploadSocialMedia(
  files: ArrayLike<File> | null,
  current: SocialMediaItem[],
  originalQuality = false,
) {
  return uploadSocialPostMedia(files, current, SOCIAL_MEDIA_MAX_ITEMS, "posts", {
    intent: "video",
    originalQuality,
  });
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
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(files: ArrayLike<File> | null) {
    if (!files || files.length === 0) return;
    const chosen = Array.from(files);
    setError("");
    setUploading(true);
    const result = await uploadSocialMedia(files, media);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.items) {
      setPreviews((current) => {
        const next = { ...current };
        result.items!.forEach((item, index) => {
          const file = chosen[index];
          if (file) next[item.key] = URL.createObjectURL(file);
        });
        return next;
      });
      setMedia((current) => [...current, ...result.items!]);
    }
  }

  return (
    <form
      data-social-post-form=""
      className="flex flex-col gap-[var(--space-3)]"
      onSubmit={(event) => {
        event.preventDefault();
        const draft = { body, media, previews };
        publishOptimisticPost({
          body,
          media,
          previews,
          authorName: SOCIAL.home.you,
          groupId,
          groupSlug,
          onLocalSuccess: () => {
            setBody("");
            setMedia([]);
            setPreviews({});
          },
          onRestore: () => {
            setBody(draft.body);
            setMedia(draft.media);
            setPreviews(draft.previews);
          },
          setError,
        });
      }}
    >
      {groupId ? <input type="hidden" name="group_id" value={groupId} /> : null}
      {groupSlug ? <input type="hidden" name="group_slug" value={groupSlug} /> : null}
      <label className="sr-only" htmlFor="social-post-body">
        {SOCIAL.home.compose}
      </label>
      <Textarea
        id="social-post-body"
        name="body"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={SOCIAL.home.compose}
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
          disabled={media.length >= SOCIAL_MEDIA_MAX_ITEMS || uploading}
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

export function SocialCreateCompose({
  authorName = SOCIAL.home.you,
  authorHandle = null,
  authorPhotoUrl = null,
  initialKind = null,
  initialStep = null,
}: {
  authorName?: string;
  authorHandle?: string | null;
  authorPhotoUrl?: string | null;
  initialKind?: SocialCreateKind | null;
  initialStep?: SocialCreateMediaStep | null;
}) {
  const router = useRouter();
  const [pickedFiles, setPickedFiles] = useState(takeSocialHomeComposerMedia);
  const kind: SocialCreateKind = initialKind ?? "text";
  const ingestPicked = pickedFiles.length > 0 && kind === "media";
  const [step, setStep] = useState<SocialCreateMediaStep>(() =>
    kind === "media" ? socialCreateMediaStepAfterPick(pickedFiles, initialStep) : "caption",
  );
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(ingestPicked);
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<SocialMediaItem[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [originalQuality, setOriginalQuality] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasVideo =
    pickedFiles.some((file) => socialMediaKindFor(file.type) === "video") ||
    media.some((item) => item.kind === "video");

  useEffect(() => {
    if (!ingestPicked) return;
    let cancelled = false;
    void uploadSocialMedia(pickedFiles, [], originalQuality).then((result) => {
      if (cancelled) return;
      setUploading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.items) {
        setPreviews((current) => {
          const next = { ...current };
          result.items!.forEach((item, index) => {
            const file = pickedFiles[index];
            if (file) next[item.key] = URL.createObjectURL(file);
          });
          return next;
        });
        setMedia(result.items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pickedFiles, ingestPicked, originalQuality]);

  useEffect(() => {
    if (kind !== "media" || step !== "pick") return undefined;
    const input = fileRef.current;
    input?.click();
    function onCancel() {
      router.back();
    }
    input?.addEventListener("cancel", onCancel);
    return () => {
      input?.removeEventListener("cancel", onCancel);
    };
  }, [kind, router, step]);

  async function onPick(files: ArrayLike<File> | null) {
    if (!files || files.length === 0 || kind !== "media") return;
    const chosen = Array.from(files);
    setPickedFiles(chosen);
    setError("");
    setUploading(true);
    const result = await uploadSocialMedia(files, media, originalQuality);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.items) {
      setPreviews((current) => {
        const next = { ...current };
        result.items!.forEach((item, index) => {
          const file = chosen[index];
          if (file) next[item.key] = URL.createObjectURL(file);
        });
        return next;
      });
      setMedia((current) => [...current, ...result.items!]);
      setStep((current) => (current === "caption" ? current : "review"));
    }
  }

  if (kind === "media" && step === "pick") {
    return (
      <div
        data-social-create-form=""
        data-social-create-kind="media"
        data-social-create-media-step="pick"
        className={SOCIAL_CREATE_CARD_CLASS}
      >
        <input
          ref={fileRef}
          type="file"
          accept={SOCIAL_CREATE_MEDIA_ACCEPT}
          multiple
          className="sr-only"
          data-social-create-media-input=""
          aria-label={SOCIAL.create.media}
          onChange={(event) => void onPick(event.target.files)}
        />
      </div>
    );
  }

  if (kind === "media" && step === "review") {
    const rows =
      media.length > 0
        ? media.map((item) => ({
            key: item.key,
            label: item.kind === "video" ? SOCIAL.home.videoKind : SOCIAL.home.photoKind,
          }))
        : pickedFiles.map((file, index) => ({
            key: `${file.name}-${index}`,
            label:
              socialMediaKindFor(file.type) === "video" ? SOCIAL.home.videoKind : SOCIAL.home.photoKind,
          }));
    return (
      <div
        data-social-create-form=""
        data-social-create-kind="media"
        data-social-create-media-step="review"
        className={SOCIAL_CREATE_CARD_CLASS}
      >
        <ul data-social-post-attachments="" className="flex flex-col gap-1">
          {rows.map((row) => (
            <li key={row.key} className="t-body-sm text-ink-2">
              {row.label}
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <button
            type="button"
            data-social-create-media-next=""
            className={SOCIAL_ACTION_CLASS}
            onClick={() => setStep("caption")}
          >
            {SOCIAL.create.next}
          </button>
        </div>
        <FormError error={error} />
      </div>
    );
  }

  return (
    <form
      data-social-create-form=""
      data-social-create-kind={kind}
      data-social-create-media-step={kind === "media" ? "caption" : undefined}
      className={SOCIAL_CREATE_CARD_CLASS}
      onSubmit={(event) => {
        event.preventDefault();
        ingestSpeechLearning({
          text: body,
          source: "typed",
          workspace: "social",
        });
        publishOptimisticPost({
          body,
          media,
          previews,
          authorName,
          authorHandle,
          authorPhotoUrl,
          onNavigate: () => {
            router.push(SOCIAL_ROUTES.home);
          },
          setError,
        });
      }}
    >
      <div className="flex items-center gap-3" data-social-create-author="">
        <SocialAvatar
          name={authorName}
          photoUrl={authorPhotoUrl}
          size="sm"
          className={SOCIAL_CREATE_AVATAR_CLASS}
        />
        <span className="min-w-0">
          <span className={SOCIAL_PERSON_PRIMARY_CLASS}>{authorName}</span>
          {authorHandle ? (
            <span className={SOCIAL_PERSON_SECONDARY_CLASS}>{displayHandle(authorHandle)}</span>
          ) : null}
        </span>
      </div>
      {kind === "media" && hasVideo ? (
        <label
          data-social-create-original-quality=""
          className="flex items-start gap-2 t-body-sm text-ink"
        >
          <input
            type="checkbox"
            className="mt-0.5"
            checked={originalQuality}
            onChange={(event) => setOriginalQuality(event.target.checked)}
          />
          <span>{SOCIAL.create.originalQuality}</span>
        </label>
      ) : null}
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
        <div data-social-create-dictate="" data-house-voice-host="" className={HOUSE_VOICE_FIELD_HOST_CLASS}>
          <Textarea
            variant="bare"
            id="social-create-body"
            name="body"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={SOCIAL.home.captionPlaceholder}
            className="h-20 min-w-0 flex-1 px-0 py-1 placeholder:text-ink-2 md:h-24"
          />
          <HouseVoiceMic
            surface="dictate"
            workspace="social"
            getValue={() => body}
            onValue={setBody}
          />
        </div>
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
        <Textarea
          id="social-bio"
          name="bio"
          rows={3}
          defaultValue={bio}
        />
      </div>
      <FormError error={error} />
      <Button type="submit" variant="secondary">
        {SOCIAL.profile.bioSubmit}
      </Button>
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
        <Textarea
          id="social-group-description"
          name="description"
          rows={3}
        />
      </div>
      <FormError error={error} />
      <Button type="submit">{SOCIAL.groupNew.submit}</Button>
    </form>
  );
}

export function SocialStoryReply({
  peerId,
  placeholder = SOCIAL.stories.reply,
}: {
  peerId: string;
  placeholder?: string;
}) {
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
      <button type="submit" className={SOCIAL_STORY_REPLY_PILL_CLASS}>
        {placeholder}
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
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <form
      data-social-dm-form=""
      data-social-dm-composer=""
      className={DM_THREAD_COMPOSER_CLASS}
      action={async (formData) => {
        setError("");
        const result = await sendSocialDm(formData);
        if (result?.error) setError(result.error);
      }}
    >
      <input type="hidden" name="conversation_id" value={conversationId} />
      <div className={DM_THREAD_COMPOSER_ROW_CLASS}>
        <label className="sr-only" htmlFor="social-dm-body">
          {SOCIAL.dms.compose}
        </label>
        <div className={DM_THREAD_COMPOSER_FIELD_CLASS}>
          <Input
            id="social-dm-body"
            name="body"
            variant="bare"
            required
            autoComplete="off"
            enterKeyHint="send"
            placeholder={SOCIAL.dms.threadPlaceholder}
            className="w-full"
          />
        </div>
        <button type="submit" aria-label={SOCIAL.dms.submit} className={DM_THREAD_COMPOSER_SEND_CLASS}>
          <SocialIcon name="paper-plane-tilt" size={18} />
        </button>
        <button
          type="button"
          data-social-dm-camera=""
          aria-label={SOCIAL.home.attach}
          className={DM_THREAD_COMPOSER_CAMERA_CLASS}
          onClick={() => fileRef.current?.click()}
        >
          <SocialIcon name="camera" size={DM_THREAD_COMPOSER_CAMERA_GLYPH} className="text-ink" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={SOCIAL_MEDIA_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          data-social-dm-attach-input=""
          aria-label={SOCIAL.home.attach}
          onChange={(event) => {
            // Library open only. No DM media insert on this path.
            event.currentTarget.value = "";
          }}
        />
      </div>
      <FormError error={error} />
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
