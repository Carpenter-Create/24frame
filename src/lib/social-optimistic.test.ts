import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SOCIAL } from "@/lib/social";
import {
  applyOptimisticLike,
  applyOptimisticSocialPost,
  beginSocialLikeEpoch,
  beginSocialPostPublish,
  clearOptimisticLike,
  failOptimisticSocialPost,
  mergeSocialLike,
  mergeSocialOptimisticPosts,
  nextSocialLikeState,
  persistSocialLike,
  persistSocialMutation,
  persistSocialPost,
  readOptimisticLike,
  readOptimisticSocialPosts,
  resetSocialOptimisticForTests,
  runSocialOptimisticMutation,
  SOCIAL_OPTIMISTIC_LOCK,
  socialLikeEpochIsCurrent,
  socialOptimisticNotice,
  socialOptimisticPersistNotice,
  socialOptimisticPostCard,
  socialOptimisticPostMatches,
} from "@/lib/social-optimistic";

describe("Social optimistic mutation SoT", () => {
  afterEach(() => {
    resetSocialOptimisticForTests();
    vi.unstubAllGlobals();
  });

  it("flips like count immediately and never goes below zero", () => {
    expect(nextSocialLikeState({ liked: false, likeCount: 3 })).toEqual({ liked: true, likeCount: 4 });
    expect(nextSocialLikeState({ liked: true, likeCount: 1 })).toEqual({ liked: false, likeCount: 0 });
    expect(nextSocialLikeState({ liked: true, likeCount: 0 })).toEqual({ liked: false, likeCount: 0 });
    applyOptimisticLike("p1", { liked: true, likeCount: 4 });
    expect(mergeSocialLike("p1", { liked: false, likeCount: 3 })).toEqual({ liked: true, likeCount: 4 });
    expect(readOptimisticLike("missing")).toBeNull();
    clearOptimisticLike("p1");
    expect(mergeSocialLike("p1", { liked: false, likeCount: 3 })).toEqual({ liked: false, likeCount: 3 });
  });

  it("applies first, persists second, and rolls back a failed persist", async () => {
    const calls: string[] = [];
    runSocialOptimisticMutation({
      apply: () => {
        calls.push("apply");
        return "token";
      },
      persist: async () => {
        calls.push("persist");
        return { error: ACCOUNT_PROFILE.saveFailed };
      },
      rollback: (token) => {
        calls.push(`rollback:${token}`);
      },
      onError: (error) => {
        calls.push(`error:${error}`);
      },
    });
    expect(calls[0]).toBe("apply");
    await vi.waitFor(() => {
      expect(calls).toEqual([
        "apply",
        "persist",
        `rollback:token`,
        `error:${ACCOUNT_PROFILE.saveFailed}`,
      ]);
    });

    const ok: string[] = [];
    runSocialOptimisticMutation({
      apply: () => {
        ok.push("apply");
        return 1;
      },
      persist: async () => {
        ok.push("persist");
        return {};
      },
      rollback: () => {
        ok.push("rollback");
      },
      onSuccess: () => {
        ok.push("success");
      },
    });
    await vi.waitFor(() => {
      expect(ok).toEqual(["apply", "persist", "success"]);
    });
  });

  it("ignores a stale like rollback after a newer tap", () => {
    const first = beginSocialLikeEpoch("p1");
    const second = beginSocialLikeEpoch("p1");
    expect(socialLikeEpochIsCurrent("p1", first)).toBe(false);
    expect(socialLikeEpochIsCurrent("p1", second)).toBe(true);
  });

  it("starts a publish hop without waiting on the server and rejects an empty post", () => {
    expect(beginSocialPostPublish({ body: "   ", mediaItems: [], authorName: "Ada" })).toEqual({
      ok: false,
      error: SOCIAL.home.emptyPost,
    });
    const started = beginSocialPostPublish({
      body: "hello",
      mediaItems: [{ kind: "image", key: "posts/u1/a.jpg", contentType: "image/jpeg" }],
      mediaPreview: [{ kind: "image", url: "blob:photo" }],
      authorName: "Ada Lovelace",
      authorHandle: "ada",
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.form.get("body")).toBe("hello");
    expect(started.form.get("media")).toContain("posts/u1/a.jpg");
    expect(started.post.body).toBe("hello");
    expect(started.post.authorHandle).toBe("ada");
    expect(started.post.media).toEqual([{ kind: "image", url: "blob:photo" }]);
    applyOptimisticSocialPost(started.post);
    const merged = mergeSocialOptimisticPosts(
      [{ id: "old", body: "earlier", authorHandle: "ada" }],
      readOptimisticSocialPosts(),
    );
    expect(merged[0]?.id).toBe(started.post.id);
    expect(socialOptimisticPostCard(started.post).canLike).toBe(false);
    expect(
      socialOptimisticPostMatches({ body: "hello", authorHandle: "ada" }, started.post),
    ).toBe(true);
    failOptimisticSocialPost(started.post.id, ACCOUNT_PROFILE.saveFailed);
    expect(socialOptimisticNotice(readOptimisticSocialPosts())).toBe(ACCOUNT_PROFILE.saveFailed);
    expect(
      mergeSocialOptimisticPosts([{ id: "old", body: "earlier", authorHandle: "ada" }], readOptimisticSocialPosts()),
    ).toHaveLength(1);
  });

  it("persists like and post over fetch so the tree does not refresh", async () => {
    expect(SOCIAL_OPTIMISTIC_LOCK.likeHref).toBe("/api/social/like");
    expect(SOCIAL_OPTIMISTIC_LOCK.postHref).toBe("/api/social/post");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const like = new FormData();
    like.set("post_id", "p1");
    expect(await persistSocialLike(like)).toEqual({});
    expect(fetchMock).toHaveBeenCalledWith("/api/social/like", {
      method: "POST",
      body: like,
      cache: "no-store",
    });
    const post = new FormData();
    post.set("body", "hello");
    expect(await persistSocialPost(post)).toEqual({});
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: SOCIAL.home.emptyPost }), { status: 400 }),
    );
    expect(await persistSocialMutation("/api/social/post", post)).toEqual({
      error: SOCIAL.home.emptyPost,
    });
    expect(socialOptimisticPersistNotice(new Error("boom"))).toBe("boom");
    expect(socialOptimisticPersistNotice(null)).toBe(ACCOUNT_PROFILE.saveFailed);
  });

  it("keeps one helper for like + composer and leaves follow toast + chip drafts alone", () => {
    const forms = readFileSync("src/components/social/social-forms.tsx", "utf8");
    const engagement = readFileSync("src/components/social/social-engagement.tsx", "utf8");
    const likeChunk = engagement.slice(engagement.indexOf("export function SocialLikeButton"));
    const createChunk = forms.slice(
      forms.indexOf("export function SocialCreateCompose"),
      forms.indexOf("export { SocialStoryCompose }"),
    );
    const followChunk = engagement.slice(
      engagement.indexOf("export function SocialFollowButton"),
      engagement.indexOf("export function SocialLikeButton"),
    );
    const goLive = readFileSync("src/components/social/social-go-live.tsx", "utf8");
    const edit = readFileSync("src/components/social/social-profile-edit.tsx", "utf8");
    const roles = readFileSync("src/components/social/social-profile-roles.tsx", "utf8");
    const topics = readFileSync("src/components/social/social-profile-topics.tsx", "utf8");
    const sot = readFileSync("src/lib/social-optimistic.ts", "utf8");
    const profileEdit = readFileSync("src/lib/social-profile-edit.ts", "utf8");

    expect(sot).toContain("export function runSocialOptimisticMutation");
    expect(sot).toContain("export async function persistSocialMutation");
    expect(profileEdit).toContain("persistSocialMutation(");
    expect(forms).toContain("function publishOptimisticPost");
    expect(forms).toContain("runSocialOptimisticMutation");
    expect(forms).toContain("persistSocialPost");
    expect(likeChunk).toContain("runSocialOptimisticMutation");
    expect(likeChunk).toContain("persistSocialLike");
    expect(likeChunk).not.toContain("await toggleSocialLike");
    expect(likeChunk).not.toContain("router.refresh()");
    expect(createChunk).toContain("publishOptimisticPost");
    expect(createChunk).toContain("router.push(SOCIAL_ROUTES.home)");
    expect(createChunk).not.toContain("await createSocialPost");
    expect(goLive).toContain("runSocialOptimisticMutation");
    expect(goLive).toContain("persistSocialPost");
    expect(goLive).toContain("router.push(SOCIAL_ROUTES.home)");
    const goLivePublish = goLive.slice(goLive.indexOf("async function postClip"));
    expect(goLivePublish.indexOf("router.push(SOCIAL_ROUTES.home)")).toBeLessThan(
      goLivePublish.indexOf("persistSocialPost"),
    );
    expect(goLive).not.toContain("await createSocialPost");
    expect(followChunk).toContain("const result = await toggleSocialFollow");
    expect(followChunk).toContain("followedConfirmCopy");
    expect(followChunk).not.toContain("router.refresh()");
    expect(roles).toContain("onChange(");
    expect(topics).toContain("onChange(");
    expect(roles).not.toContain("persistSocial");
    expect(topics).not.toContain("persistSocial");
    expect(edit).toContain("checkSocialProfileEditSave");
    expect(edit).toContain("persistSocialProfileEdit");
  });
});
