"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import {
  followInsertRow,
  likeInsertRow,
  SOCIAL,
  SOCIAL_ROUTES,
  socialGroupHref,
  socialGroupPostHref,
  socialPostHref,
} from "@/lib/social";
import { commentBodyError, commentInsertRow, normalizeCommentBody } from "@/lib/social-comments";
import { bustSocialFollowHotCache } from "@/lib/social-hot-cache";
import {
  isFollowUniqueViolation,
  newFollowerNoticeCopy,
  newFollowerSourceRefs,
} from "@/lib/social-follow";

// Follow / like only. No AWS, no MediaRecorder, no profile Save.
// Public Edge reads import these — not actions.ts (presign lives there).

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
      await supabase.rpc("notify_new_follower", {
        p_followee: followeeId,
        p_title: copy.title,
        p_body: copy.body,
        p_source_refs: newFollowerSourceRefs({ actorId: user.id, handle: profile.handle }),
      });
    }
  }

  await bustSocialFollowHotCache(user.id, followeeId);
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
  revalidatePath(socialPostHref(postId));
  const slug = String(formData.get("group_slug") ?? "").trim();
  if (slug) {
    revalidatePath(socialGroupHref(slug));
    revalidatePath(socialGroupPostHref(slug, postId));
  }
  return {};
}

type CommentActionResult = ActionResult & { id?: string; created_at?: string };

export async function createSocialComment(formData: FormData): Promise<CommentActionResult> {
  const { user, supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const postId = String(formData.get("post_id") ?? "").trim();
  const raw = String(formData.get("body") ?? "");
  const body = normalizeCommentBody(raw);
  if (!postId) return { error: SOCIAL.post.missing };
  if (!body) return { error: commentBodyError(raw) };

  const { data, error } = await supabase
    .from("comments")
    .insert(commentInsertRow({ postId, authorId: user.id, body }))
    .select("id, created_at")
    .single();
  if (error || !data) return { error: error?.message || SOCIAL.post.commentFailed };

  revalidatePath(SOCIAL_ROUTES.home);
  revalidatePath(SOCIAL_ROUTES.profile);
  revalidatePath(socialPostHref(postId));
  const slug = String(formData.get("group_slug") ?? "").trim();
  if (slug) {
    revalidatePath(socialGroupHref(slug));
    revalidatePath(socialGroupPostHref(slug, postId));
  }
  return { id: data.id, created_at: data.created_at };
}

export async function deleteSocialComment(formData: FormData): Promise<ActionResult> {
  const { user, supabase, profileId } = await ownProfile();
  if (!profileId) return { error: SOCIAL.cta.needProfile };

  const commentId = String(formData.get("comment_id") ?? "").trim();
  if (!commentId) return { error: SOCIAL.post.missing };

  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", user.id);
  if (error) return { error: error.message || SOCIAL.post.commentDeleteFailed };

  revalidatePath(SOCIAL_ROUTES.home);
  revalidatePath(SOCIAL_ROUTES.profile);
  return {};
}
