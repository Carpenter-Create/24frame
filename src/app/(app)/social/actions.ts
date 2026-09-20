"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  mediaItemsForInsert,
  parseSocialMediaLane,
  socialMediaObjectKey,
  validateMediaUpload,
} from "@/lib/social-media";
import { presignSocialMediaPut } from "@/lib/s3-social-media";
import { normalizeSocialCategory } from "@/lib/social-categories";
import { storyInsertRow, storyViewInsertRow } from "@/lib/social-stories";
import { ensureOwnSocialProfile, isProfileUniqueViolation } from "@/lib/social-profile";
import { SOCIAL_DM_ADD_BATCH_LIMIT } from "@/lib/social-dm-bounds";
import {
  followInsertRow,
  groupInsertRow,
  handleKey,
  likeInsertRow,
  messageInsertRow,
  normalizeBio,
  normalizeDisplayName,
  normalizeGroupDescription,
  normalizeGroupName,
  normalizeConversationTitle,
  normalizeGroupSlug,
  normalizeHandle,
  normalizeMessageBody,
  normalizePostBody,
  postInsertRow,
  profileInsertRow,
  quietDmAddError,
  SOCIAL,
  SOCIAL_ROUTES,
  socialPublicDisplayName,
  socialDmHref,
  socialGroupHref,
  socialHandleRequiredError,
  socialMediaRuleMessage,
  socialProfileHref,
} from "@/lib/social";
import {
  isFollowUniqueViolation,
  newFollowerNoticeCopy,
  newFollowerSourceRefs,
} from "@/lib/social-follow";

type ActionResult = { error?: string };

async function requireUser() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}

async function ownProfile() {
  const user = await requireUser();
  const supabase = await createClient();
  const profile = await ensureOwnSocialProfile(supabase, user);
  return { user, supabase, profile, profileId: profile?.id ?? null };
}

export async function createSocialProfile(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const raw = String(formData.get("handle") ?? "");
  const required = socialHandleRequiredError(raw);
  if (required) return { error: required };
  const handle = normalizeHandle(raw);
  if (!handle) return { error: SOCIAL.profile.handleInvalid };

  const profile = await ensureOwnSocialProfile(supabase, user);
  const displayName =
    normalizeDisplayName(String(formData.get("display_name") ?? "")) ??
    socialPublicDisplayName(profile?.display_name) ??
    "";

  if (profile) {
    const { error } = await supabase
      .from("profiles")
      .update({ handle, display_name: displayName })
      .eq("id", user.id);
    if (error) {
      if (isProfileUniqueViolation(error)) return { error: SOCIAL.profile.handleTaken };
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("profiles").insert(
      profileInsertRow({
        userId: user.id,
        handle,
        displayName,
      }),
    );
    if (error) {
      if (isProfileUniqueViolation(error)) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ handle, display_name: displayName })
          .eq("id", user.id);
        if (updateError) {
          if (isProfileUniqueViolation(updateError)) return { error: SOCIAL.profile.handleTaken };
          return { error: updateError.message };
        }
      } else {
        return { error: error.message };
      }
    }
  }

  revalidatePath(SOCIAL_ROUTES.profile);
  revalidatePath(SOCIAL_ROUTES.profileEdit);
  revalidatePath(SOCIAL_ROUTES.profileBio);
  revalidatePath(SOCIAL_ROUTES.home);
  revalidatePath(socialProfileHref(handle));
  return {};
}

export async function presignSocialMediaUpload(formData: FormData): Promise<{
  error?: string;
  key?: string;
  url?: string;
  kind?: string;
  contentType?: string;
}> {
  const { user, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const lane = parseSocialMediaLane(String(formData.get("lane") ?? ""));
  const checked = validateMediaUpload({
    contentType: String(formData.get("content_type") ?? ""),
    byteLength: Number(formData.get("byte_length") ?? 0),
    lane,
  });
  if (!checked.ok) return { error: socialMediaRuleMessage(checked.error, lane) };
  const key = socialMediaObjectKey(user.id, crypto.randomUUID(), checked.contentType, lane);
  try {
    const url = await presignSocialMediaPut(key, checked.contentType);
    return { key, url, kind: checked.kind, contentType: checked.contentType };
  } catch {
    return { error: SOCIAL.home.uploadFailed };
  }
}

export async function createSocialPost(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const body = normalizePostBody(String(formData.get("body") ?? ""));
  const media = mediaItemsForInsert(formData.get("media"), user.id);
  const groupIdRaw = String(formData.get("group_id") ?? "").trim();
  const groupId = groupIdRaw.length > 0 ? groupIdRaw : null;
  const category = groupId ? null : normalizeSocialCategory(String(formData.get("category") ?? ""));
  if (!media.ok) return { error: socialMediaRuleMessage(media.error) };
  if (!body && media.items.length === 0) return { error: SOCIAL.home.emptyPost };

  const { error } = await supabase.from("posts").insert(
    postInsertRow({ authorId: user.id, body, groupId, media: media.items, category }),
  );
  if (error) return { error: error.message };

  const slug = String(formData.get("group_slug") ?? "").trim();
  revalidatePath(SOCIAL_ROUTES.home);
  revalidatePath(SOCIAL_ROUTES.create);
  if (slug) revalidatePath(socialGroupHref(slug));
  if (!groupId) redirect(SOCIAL_ROUTES.home);
  return {};
}

export async function createSocialStory(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const body = normalizePostBody(String(formData.get("body") ?? "")) ?? null;
  const media = mediaItemsForInsert(formData.get("media"), user.id, "stories");
  if (!media.ok) return { error: socialMediaRuleMessage(media.error, "stories") };
  if (media.items.length === 0) return { error: SOCIAL.stories.empty };
  if (media.items.some((item) => item.kind !== "video")) {
    return { error: SOCIAL.stories.mediaType };
  }

  const { error } = await supabase.from("stories").insert(
    storyInsertRow({ authorId: user.id, body, media: media.items }),
  );
  if (error) return { error: error.message };

  revalidatePath(SOCIAL_ROUTES.home);
  revalidatePath(SOCIAL_ROUTES.stories);
  revalidatePath(SOCIAL_ROUTES.storiesNew);
  return {};
}

export async function markSocialStoryViewed(storyId: string): Promise<void> {
  const { user, supabase, profileId } = await ownProfile();
  if (!profileId || !storyId) return;
  await supabase.from("story_views").insert(storyViewInsertRow(storyId, user.id));
}

export async function updateSocialBio(formData: FormData): Promise<ActionResult> {
  const { supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const bio = normalizeBio(String(formData.get("bio") ?? ""));
  if (bio == null) return { error: SOCIAL.profile.bioLimit };

  const { error } = await supabase.from("profiles").update({ bio: bio || null }).eq("id", profileId);
  if (error) return { error: error.message };

  revalidatePath(SOCIAL_ROUTES.profile);
  revalidatePath(SOCIAL_ROUTES.profileEdit);
  revalidatePath(SOCIAL_ROUTES.profileBio);
  revalidatePath(SOCIAL_ROUTES.home);
  return {};
}

export async function toggleSocialFollow(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profile } = await ownProfile();
  if (!profile) return { error: SOCIAL.cta.needProfile };

  const followeeId = String(formData.get("followee_id") ?? "").trim();
  const following = String(formData.get("following") ?? "") === "1";
  if (!followeeId || followeeId === user.id) return { error: SOCIAL.member.missing };

  if (following) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followee_id", followeeId);
    if (error) return { error: error.message || SOCIAL.follow.failed };
  } else {
    const { error } = await supabase.from("follows").insert(followInsertRow(user.id, followeeId));
    if (error && !isFollowUniqueViolation(error)) {
      return { error: error.message || SOCIAL.follow.failed };
    }
    if (!error) {
      const copy = newFollowerNoticeCopy(profile.handle);
      // Follow already landed. Alert is best-effort until founder applies SQL.
      await supabase.rpc("notify_new_follower", {
        p_followee: followeeId,
        p_title: copy.title,
        p_body: copy.body,
        p_source_refs: newFollowerSourceRefs({ actorId: user.id, handle: profile.handle }),
      });
    }
  }

  revalidatePath(SOCIAL_ROUTES.home);
  revalidatePath(SOCIAL_ROUTES.profile);
  if (profile.handle) revalidatePath(socialProfileHref(profile.handle));
  const handle = String(formData.get("handle") ?? "").trim();
  if (handle) revalidatePath(socialProfileHref(handle));
  return {};
}

export async function toggleSocialLike(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const postId = String(formData.get("post_id") ?? "").trim();
  const liked = String(formData.get("liked") ?? "") === "1";
  if (!postId) return { error: "Missing post." };

  if (liked) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", "post")
      .eq("target_id", postId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("likes").insert(likeInsertRow(user.id, postId));
    if (error) return { error: error.message };
  }

  revalidatePath(SOCIAL_ROUTES.home);
  const slug = String(formData.get("group_slug") ?? "").trim();
  if (slug) {
    revalidatePath(socialGroupHref(slug));
    revalidatePath(`${socialGroupHref(slug)}/posts/${postId}`);
  }
  return {};
}

export async function createSocialGroup(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const { data: canCreate } = await supabase.rpc("has_capability", {
    p_user: user.id,
    p_cap: "create_group",
  });
  if (canCreate !== true) return { error: SOCIAL.groups.forbidden };

  const name = normalizeGroupName(String(formData.get("name") ?? ""));
  const slug = normalizeGroupSlug(String(formData.get("slug") ?? ""));
  const description = normalizeGroupDescription(String(formData.get("description") ?? "")) ?? null;
  if (!name) return { error: "Enter a group name." };
  if (!slug) return { error: "Enter a slug of 3–40 lowercase letters, numbers, or hyphens." };

  const { data: created, error } = await supabase
    .from("groups")
    .insert(groupInsertRow({ name, slug, description, createdBy: user.id }))
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };

  if (created) {
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: created.id,
      user_id: user.id,
      role: "owner",
    });
    if (memberError) return { error: memberError.message };
  }

  revalidatePath(SOCIAL_ROUTES.groups);
  redirect(socialGroupHref(slug));
}

export async function joinSocialGroup(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const groupId = String(formData.get("group_id") ?? "").trim();
  const slug = String(formData.get("group_slug") ?? "").trim();
  if (!groupId) return { error: "Missing group." };

  const { error } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "member",
  });
  if (error) return { error: error.message };

  revalidatePath(SOCIAL_ROUTES.groups);
  if (slug) revalidatePath(socialGroupHref(slug));
  return {};
}

export async function openSocialDm(formData: FormData): Promise<ActionResult> {
  const { supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const peer = String(formData.get("peer_id") ?? "").trim();
  if (!peer) return { error: "Missing member." };

  const { data, error } = await supabase.rpc("open_or_get_direct_conversation", {
    p_peer: peer,
  });
  if (error || !data) return { error: error?.message ?? SOCIAL.member.missing };

  redirect(socialDmHref(data));
}

export async function sendSocialDm(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const body = normalizeMessageBody(String(formData.get("body") ?? ""));
  if (!conversationId) return { error: "Missing conversation." };
  if (!body) return { error: "Write a message first." };

  const { error } = await supabase.from("messages").insert(
    messageInsertRow({
      senderId: user.id,
      conversationId,
      body,
    }),
  );
  if (error) return { error: error.message };

  revalidatePath(socialDmHref(conversationId));
  revalidatePath(SOCIAL_ROUTES.dms);
  redirect(socialDmHref(conversationId));
}

export async function markSocialDmRead(conversationId: string): Promise<void> {
  const user = await getAuthUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase.rpc("mark_direct_conversation_read", {
    p_conversation: conversationId,
    p_seen_at: new Date().toISOString(),
  });
}

export async function addSocialDmPeople(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  if (!conversationId) return { error: SOCIAL.dms.missing };

  const handles = String(formData.get("handles") ?? "")
    .split(/[\s,]+/)
    .map((part) => normalizeHandle(part))
    .filter((handle): handle is string => !!handle);
  if (handles.length === 0) return { error: SOCIAL.dms.addMissing };
  if (handles.length > SOCIAL_DM_ADD_BATCH_LIMIT) return { error: SOCIAL.dms.addBatch };

  const { data: peers } = await supabase
    .from("profiles")
    .select("id, handle")
    .in("handle", handles);
  const found = peers ?? [];
  if (found.length === 0) return { error: SOCIAL.dms.addMissing };

  const foundHandles = new Set(found.map((peer) => handleKey(peer.handle)));
  if (handles.some((handle) => !foundHandles.has(handleKey(handle)))) {
    return { error: SOCIAL.dms.addMissing };
  }

  const ids = [...new Set(found.map((peer) => peer.id))];
  if (ids.includes(user.id)) return { error: SOCIAL.dms.addSelf };

  const { error } = await supabase.rpc("add_conversation_participants", {
    p_conversation: conversationId,
    p_peers: ids,
  });
  if (error) return { error: quietDmAddError(error.message) };

  revalidatePath(socialDmHref(conversationId));
  revalidatePath(SOCIAL_ROUTES.dms);
  return {};
}

export async function setSocialDmTitle(formData: FormData): Promise<ActionResult> {
  const { supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  if (!conversationId) return { error: SOCIAL.dms.missing };

  const parsed = normalizeConversationTitle(String(formData.get("title") ?? ""));
  if (!parsed) return { error: SOCIAL.dms.titleInvalid };

  const { error } = await supabase.rpc("set_group_conversation_title", {
    p_conversation: conversationId,
    p_title: parsed.title,
  });
  if (error) return { error: quietDmAddError(error.message) };

  revalidatePath(socialDmHref(conversationId));
  revalidatePath(SOCIAL_ROUTES.dms);
  return {};
}
