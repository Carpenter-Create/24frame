"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import { SOCIAL } from "@/lib/social";
import {
  createSocialGroup,
  createSocialPost,
  createSocialProfile,
  joinSocialGroup,
  openSocialDm,
  sendSocialDm,
  toggleSocialLike,
} from "@/app/(app)/social/actions";

function FormError({ error }: { error: string }) {
  if (!error) return null;
  return <InlineNotice tone="error">{error}</InlineNotice>;
}

export function SocialProfileCreateForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      data-social-profile-form=""
      className="flex max-w-md flex-col gap-[var(--space-4)]"
      action={async (formData) => {
        setPending(true);
        setError("");
        const result = await createSocialProfile(formData);
        setPending(false);
        if (result.error) setError(result.error);
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="social-handle">{SOCIAL.profile.handle}</Label>
        <Input id="social-handle" name="handle" autoComplete="username" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="social-display-name">{SOCIAL.profile.displayName}</Label>
        <Input id="social-display-name" name="display_name" autoComplete="nickname" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="social-birth-date">{SOCIAL.profile.birthDate}</Label>
        <Input id="social-birth-date" name="birth_date" type="date" required />
        <p className="t-body-sm text-ink-3">{SOCIAL.profile.birthDateHint}</p>
      </div>
      <FormError error={error} />
      <Button type="submit" disabled={pending}>
        {SOCIAL.profile.submit}
      </Button>
    </form>
  );
}

export function SocialPostCompose({
  groupId,
  groupSlug,
}: {
  groupId?: string;
  groupSlug?: string;
}) {
  const [error, setError] = useState("");

  return (
    <form
      data-social-post-form=""
      className="flex flex-col gap-[var(--space-3)]"
      action={async (formData) => {
        setError("");
        const result = await createSocialPost(formData);
        if (result.error) setError(result.error);
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
        required
        placeholder={SOCIAL.home.compose}
        className="w-full rounded-[var(--radius)] border border-hairline bg-surface px-3 py-2 t-body text-ink outline-none placeholder:text-ink-3 focus:border-accent"
      />
      <FormError error={error} />
      <Button type="submit">{SOCIAL.home.submit}</Button>
    </form>
  );
}

export function SocialLikeButton({
  postId,
  liked,
  likeCount,
  groupSlug,
  disabled,
}: {
  postId: string;
  liked: boolean;
  likeCount: number;
  groupSlug?: string;
  disabled?: boolean;
}) {
  return (
    <form action={toggleSocialLike} className="inline">
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="liked" value={liked ? "1" : "0"} />
      {groupSlug ? <input type="hidden" name="group_slug" value={groupSlug} /> : null}
      <button
        type="submit"
        disabled={disabled}
        data-social-like=""
        className={TEXT_ACTION_CLASS}
      >
        {liked ? SOCIAL.post.unlike : SOCIAL.post.like}
        {likeCount > 0 ? ` · ${likeCount}` : ""}
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
        if (result.error) setError(result.error);
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
