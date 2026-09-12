"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  groupInsertRow,
  isEligibleBirthDate,
  likeInsertRow,
  messageInsertRow,
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
  socialDmHref,
  socialGroupHref,
} from "@/lib/social";

type ActionResult = { error?: string };

async function requireUser() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}

async function ownProfileId() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  return { user, supabase, profileId: data?.id ?? null };
}

export async function createSocialProfile(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const handle = normalizeHandle(String(formData.get("handle") ?? ""));
  const displayName = normalizeDisplayName(String(formData.get("display_name") ?? ""));
  const birthDate = String(formData.get("birth_date") ?? "");

  if (!handle) return { error: "Enter a handle of 3–30 letters, numbers, or underscores." };
  if (!displayName) return { error: "Enter a display name." };
  if (!isEligibleBirthDate(birthDate)) return { error: SOCIAL.profile.birthDateHint };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return { error: "A creator profile already exists." };

  const { error } = await supabase.from("profiles").insert(
    profileInsertRow({
      userId: user.id,
      handle,
      displayName,
      birthDate,
    }),
  );
  if (error) {
    if (error.message.toLowerCase().includes("duplicate") || error.code === "23505") {
      return { error: SOCIAL.profile.handleTaken };
    }
    return { error: error.message };
  }

  revalidatePath(SOCIAL_ROUTES.profile);
  revalidatePath(SOCIAL_ROUTES.home);
  return {};
}

export async function createSocialPost(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profileId } = await ownProfileId();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const body = normalizePostBody(String(formData.get("body") ?? ""));
  const groupIdRaw = String(formData.get("group_id") ?? "").trim();
  const groupId = groupIdRaw.length > 0 ? groupIdRaw : null;
  if (!body) return { error: "Write a post first." };

  const { error } = await supabase.from("posts").insert(
    postInsertRow({ authorId: user.id, body, groupId }),
  );
  if (error) return { error: error.message };

  const slug = String(formData.get("group_slug") ?? "").trim();
  revalidatePath(SOCIAL_ROUTES.home);
  if (slug) revalidatePath(socialGroupHref(slug));
  return {};
}

export async function toggleSocialLike(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profileId } = await ownProfileId();
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
  const { user, supabase, profileId } = await ownProfileId();
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
  const { user, supabase, profileId } = await ownProfileId();
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
  const { supabase, profileId } = await ownProfileId();
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
  const { user, supabase, profileId } = await ownProfileId();
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
  return {};
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
  const { user, supabase, profileId } = await ownProfileId();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  if (!conversationId) return { error: SOCIAL.dms.missing };

  const handles = String(formData.get("handles") ?? "")
    .split(/[\s,]+/)
    .map((part) => normalizeHandle(part))
    .filter((handle): handle is string => !!handle);
  if (handles.length === 0) return { error: SOCIAL.dms.addMissing };

  const { data: peers } = await supabase
    .from("profiles")
    .select("id, handle")
    .in("handle", handles);
  const found = peers ?? [];
  if (found.length === 0) return { error: SOCIAL.dms.addMissing };

  const foundHandles = new Set(found.map((peer) => peer.handle));
  if (handles.some((handle) => !foundHandles.has(handle))) {
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
  const { supabase, profileId } = await ownProfileId();
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
