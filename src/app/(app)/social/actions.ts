"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  isOwnedSocialMediaKey,
  isSocialMediaContentType,
  mediaItemsForInsert,
  parseSocialMediaLane,
  socialMediaKindFor,
  socialMediaObjectKey,
  storedSocialMediaRejection,
  validateMediaUpload,
  profileCoverKeyFromMedia,
  welcomeVideoKeyFromMedia,
  type SocialMediaItem,
} from "@/lib/social-media";
import { headSocialMediaObject, presignSocialMediaPut } from "@/lib/s3-social-media";
import { isSocialMuxId, SOCIAL_MUX_PROVIDER, SocialMuxUploadNotBoundError } from "@/lib/social-mux";
import {
  createSocialMuxDirectUpload,
  finalizeSocialMuxDirectUpload,
  socialMuxSettingsFromUploadInput,
} from "@/lib/social-mux-server";
import { normalizeSocialCategory } from "@/lib/social-categories";
import { storyInsertRow, storyViewInsertRow } from "@/lib/social-stories";
import { ensureOwnSocialProfile, isProfileUniqueViolation } from "@/lib/social-profile";
import { handleTakenError, lookupHandleCollision } from "@/lib/social-handle-taken";
import { socialProfileRolesWrite } from "@/lib/social-profile-roles";
import { socialProfileTopicsWrite } from "@/lib/social-profile-topics";
import {
  composeSocialWebsiteUrlField,
  parseSocialProfileLinksWrite,
  socialProfileLinkError,
} from "@/lib/social-profile-links";
import { parseSocialImdbInput } from "@/lib/social-imdb";
import { SOCIAL_DM_ADD_BATCH_LIMIT } from "@/lib/social-dm-bounds";
import {
  groupInsertRow,
  messageInsertRow,
  normalizeBio,
  composeSocialDisplayName,
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
  socialHandleInputError,
  socialNameRequiredError,
  socialMediaRuleMessage,
  socialProfileHref,
} from "@/lib/social";
import { bustSocialFeedHotCache, bustSocialProfileHotCache } from "@/lib/social-hot-cache";

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
  const formatError = socialHandleInputError(raw);
  if (formatError) return { error: formatError };
  const handle = normalizeHandle(raw)!;

  const collision = await lookupHandleCollision(supabase, handle);
  const taken = handleTakenError({ ownerId: user.id, collisionId: collision?.id ?? null });
  if (taken) return { error: taken };

  const profile = await ensureOwnSocialProfile(supabase, user);
  const firstName = String(formData.get("first_name") ?? "");
  const middleName = String(formData.get("middle_name") ?? "");
  const lastName = String(formData.get("last_name") ?? "");
  const hasNameParts =
    Boolean(firstName || middleName || lastName) ||
    formData.has("first_name") ||
    formData.has("last_name");
  if (hasNameParts) {
    const nameError = socialNameRequiredError(firstName, lastName);
    if (nameError) return { error: nameError };
  }
  const composed = composeSocialDisplayName(firstName, lastName, middleName);
  const displayName =
    normalizeDisplayName(composed) ??
    normalizeDisplayName(String(formData.get("display_name") ?? "")) ??
    socialPublicDisplayName(profile?.display_name) ??
    "";

  const roles = formData.has("crafts") ? socialProfileRolesWrite(formData.get("crafts")) : null;
  const topics = formData.has("topics") ? socialProfileTopicsWrite(formData.get("topics")) : null;
  const imdb = formData.has("imdb_url")
    ? parseSocialImdbInput(String(formData.get("imdb_url") ?? ""))
    : null;
  if (imdb?.error) return { error: SOCIAL.profile.imdbInvalid };
  const links = formData.has("links")
    ? parseSocialProfileLinksWrite(String(formData.get("links") ?? ""))
    : null;
  if (links?.error) return { error: socialProfileLinkError(links.error) ?? SOCIAL.profile.linkInvalid };

  if (profile) {
    const { error } = await supabase
      .from("profiles")
      .update({
        handle,
        display_name: displayName,
        ...(roles
          ? { crafts: roles.crafts, primary_role: roles.primary_role }
          : {}),
        ...(topics ? { topics } : {}),
        ...(imdb ? { imdb_url: imdb.url } : {}),
        ...(links ? { website_url: composeSocialWebsiteUrlField(links.urls) } : {}),
      })
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
          .update({
            handle,
            display_name: displayName,
            ...(roles
              ? { crafts: roles.crafts, primary_role: roles.primary_role }
              : {}),
            ...(topics ? { topics } : {}),
            ...(imdb ? { imdb_url: imdb.url } : {}),
            ...(links ? { website_url: composeSocialWebsiteUrlField(links.urls) } : {}),
          })
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

  await bustSocialProfileHotCache(user.id, [profile?.handle, handle]);
  revalidatePath(SOCIAL_ROUTES.profile);
  revalidatePath(SOCIAL_ROUTES.profileEdit);
  revalidatePath(socialProfileHref(handle));
  if (profile?.handle && profile.handle !== handle) {
    revalidatePath(socialProfileHref(profile.handle));
  }
  return {};
}

export async function saveSocialWelcomeVideo(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profile, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };
  const key = welcomeVideoKeyFromMedia(formData.get("media"), user.id);
  if (!key) return { error: SOCIAL.stories.mediaType };
  const { error } = await supabase.from("profiles").update({ welcome_video_key: key }).eq("id", user.id);
  if (error) return { error: error.message };
  await bustSocialProfileHotCache(user.id, [profile?.handle]);
  revalidatePath(SOCIAL_ROUTES.profile);
  revalidatePath(SOCIAL_ROUTES.profileEdit);
  if (profile?.handle) revalidatePath(socialProfileHref(profile.handle));
  return {};
}

export async function clearSocialWelcomeVideo(): Promise<ActionResult> {
  const { user, supabase, profile, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };
  const { error } = await supabase.from("profiles").update({ welcome_video_key: null }).eq("id", user.id);
  if (error) return { error: error.message };
  await bustSocialProfileHotCache(user.id, [profile?.handle]);
  revalidatePath(SOCIAL_ROUTES.profile);
  revalidatePath(SOCIAL_ROUTES.profileEdit);
  if (profile?.handle) revalidatePath(socialProfileHref(profile.handle));
  return {};
}

export async function saveSocialProfileCover(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profile, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };
  const key = profileCoverKeyFromMedia(formData.get("media"), user.id);
  if (!key) return { error: SOCIAL.stories.mediaType };
  const { error } = await supabase.from("profiles").update({ cover_key: key }).eq("id", user.id);
  if (error) return { error: error.message };
  await bustSocialProfileHotCache(user.id, [profile?.handle]);
  revalidatePath(SOCIAL_ROUTES.profile);
  revalidatePath(SOCIAL_ROUTES.profileEdit);
  if (profile?.handle) revalidatePath(socialProfileHref(profile.handle));
  return {};
}

export async function clearSocialProfileCover(): Promise<ActionResult> {
  const { user, supabase, profile, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };
  const { error } = await supabase.from("profiles").update({ cover_key: null }).eq("id", user.id);
  if (error) return { error: error.message };
  await bustSocialProfileHotCache(user.id, [profile?.handle]);
  revalidatePath(SOCIAL_ROUTES.profile);
  revalidatePath(SOCIAL_ROUTES.profileEdit);
  if (profile?.handle) revalidatePath(socialProfileHref(profile.handle));
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
  const byteLength = Number(formData.get("byte_length") ?? 0);
  const checked = validateMediaUpload({
    contentType: String(formData.get("content_type") ?? ""),
    byteLength,
    lane,
  });
  if (!checked.ok) return { error: socialMediaRuleMessage(checked.error, lane) };
  const key = socialMediaObjectKey(user.id, crypto.randomUUID(), checked.contentType, lane);
  try {
    const url = await presignSocialMediaPut(key, checked.contentType, byteLength);
    return { key, url, kind: checked.kind, contentType: checked.contentType };
  } catch {
    return { error: SOCIAL.home.uploadFailed };
  }
}

export async function createSocialMuxUpload(formData: FormData): Promise<{
  error?: string;
  key?: string;
  url?: string;
  uploadId?: string;
  kind?: string;
  contentType?: string;
}> {
  const { user, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const lane = parseSocialMediaLane(String(formData.get("lane") ?? ""));
  if (lane !== "posts") return { error: SOCIAL.home.mediaType };
  const checked = validateMediaUpload({
    contentType: String(formData.get("content_type") ?? ""),
    byteLength: Number(formData.get("byte_length") ?? 0),
    lane,
  });
  if (!checked.ok) return { error: socialMediaRuleMessage(checked.error, lane) };
  if (checked.kind !== "video") return { error: SOCIAL.home.mediaType };

  const objectId = crypto.randomUUID();
  const key = socialMediaObjectKey(user.id, objectId, checked.contentType, lane);
  const { settings } = socialMuxSettingsFromUploadInput({
    intent: String(formData.get("intent") ?? ""),
    originalQuality: String(formData.get("original_quality") ?? "") === "1",
    width: Number(formData.get("source_width") ?? 0),
    height: Number(formData.get("source_height") ?? 0),
  });
  try {
    const upload = await createSocialMuxDirectUpload({
      settings,
      passthrough: `${user.id}:${objectId}`,
    });
    return {
      key,
      url: upload.url,
      uploadId: upload.uploadId,
      kind: checked.kind,
      contentType: checked.contentType,
    };
  } catch {
    return { error: SOCIAL.home.uploadFailed };
  }
}

export async function finalizeSocialMuxUpload(formData: FormData): Promise<{
  error?: string;
  item?: SocialMediaItem;
}> {
  const { user, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const uploadId = String(formData.get("upload_id") ?? "").trim();
  const key = String(formData.get("key") ?? "").trim();
  const contentType = String(formData.get("content_type") ?? "").trim();
  if (!isSocialMuxId(uploadId) || !isOwnedSocialMediaKey(key, user.id, "posts")) {
    return { error: SOCIAL.home.mediaForbidden };
  }
  if (!isSocialMediaContentType(contentType) || socialMediaKindFor(contentType) !== "video") {
    return { error: SOCIAL.home.mediaType };
  }
  try {
    const ready = await finalizeSocialMuxDirectUpload(uploadId, user.id);
    return {
      item: {
        kind: "video",
        key,
        contentType,
        provider: SOCIAL_MUX_PROVIDER,
        playbackId: ready.playbackId,
        uploadId: ready.uploadId,
        assetId: ready.assetId,
        playbackPolicy: "signed",
      },
    };
  } catch (error) {
    if (error instanceof SocialMuxUploadNotBoundError) {
      return { error: SOCIAL.home.mediaForbidden };
    }
    return { error: SOCIAL.home.videoPreparing };
  }
}

export async function writeSocialPost(
  formData: FormData,
): Promise<ActionResult & { groupId?: string | null }> {
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

  await bustSocialFeedHotCache(user.id);
  const slug = String(formData.get("group_slug") ?? "").trim();
  revalidatePath(SOCIAL_ROUTES.home);
  revalidatePath(SOCIAL_ROUTES.create);
  if (slug) revalidatePath(socialGroupHref(slug));
  return { groupId };
}

export async function createSocialPost(formData: FormData): Promise<ActionResult> {
  const result = await writeSocialPost(formData);
  if (result.error) return result;
  if (!result.groupId) redirect(SOCIAL_ROUTES.home);
  return {};
}

export async function createSocialStory(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const body = normalizePostBody(String(formData.get("body") ?? "")) ?? null;
  const media = mediaItemsForInsert(formData.get("media"), user.id, "stories");
  if (!media.ok) return { error: socialMediaRuleMessage(media.error, "stories") };
  if (media.items.length === 0) return { error: SOCIAL.stories.empty };

  for (const item of media.items) {
    const rejection = storedSocialMediaRejection(item, await headSocialMediaObject(item.key));
    if (rejection) return { error: socialMediaRuleMessage(rejection, "stories") };
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

  await bustSocialProfileHotCache(profileId);
  revalidatePath(SOCIAL_ROUTES.profile);
  revalidatePath(SOCIAL_ROUTES.profileEdit);
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
