import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ASK_GLOBEE } from "@/lib/ask-globee";
import { PRODUCT_NAME, SOCIAL_WORKSPACE } from "@/lib/product";
import {
  conversationRoomLabel,
  displayHandle,
  handleFieldValue,
  inboxPeerIds,
  isEligibleBirthDate,
  likeInsertRow,
  messageInsertRow,
  normalizeConversationTitle,
  normalizeHandle,
  parseProfileHandleParam,
  postInsertRow,
  profileInsertRow,
  quietDmAddError,
  SOCIAL,
  SOCIAL_BANNED_PRODUCT_NAMES,
  SOCIAL_PROFILE_ORIGIN,
  SOCIAL_ROUTES,
  socialHandleRequiredError,
  socialInitials,
  socialProfileHref,
  socialProfilePublicUrl,
  stripHandleDecorators,
  suggestedHandleSeed,
} from "./social";

describe("social copy lock", () => {
  it("uses 24Frame workspace language and never names Globee as the product", () => {
    const blob = JSON.stringify({ SOCIAL, SOCIAL_ROUTES, SOCIAL_WORKSPACE });
    expect(blob).toContain(PRODUCT_NAME);
    expect(blob).toContain(SOCIAL_WORKSPACE);
    expect(SOCIAL.home.subtitle).toContain("follow");
    expect(SOCIAL.home.subtitle).toContain(PRODUCT_NAME);
    expect(SOCIAL.explore.subtitle).toContain(PRODUCT_NAME);
    expect(SOCIAL_ROUTES.explore).toBe("/social/explore");
    expect(SOCIAL_ROUTES.create).toBe("/social/create");
    expect(SOCIAL_ROUTES.storiesNew).toBe("/social/stories/new");
    expect(SOCIAL.dms.subtitle).toContain(PRODUCT_NAME);
    expect(SOCIAL.dms.addPeople).toBe("Add people");
    expect(SOCIAL_ROUTES.dms).toBe("/social/dms");
    expect(SOCIAL_ROUTES.leaderboard).toBe("/social/leaderboard");
    expect(SOCIAL_ROUTES.courses).toBe("/social/courses");
    expect(SOCIAL_ROUTES.home).toBe("/social");
    expect(SOCIAL_ROUTES.profileByHandle).toBe("/social/u");
    expect(SOCIAL.profile.handlePlaceholder).toBe("Set your handle");
    expect(SOCIAL.profile.handleRequired).toBe("Add a handle to continue.");
    expect(SOCIAL.courses.subtitle).toContain("Social+Education");
    expect(SOCIAL.leaderboard.private).toBe("The leaderboard is private.");
    expect(SOCIAL.leaderboard.subtitle).toContain(PRODUCT_NAME);
    for (const banned of SOCIAL_BANNED_PRODUCT_NAMES) {
      expect(blob).not.toContain(banned);
    }
    expect(blob).not.toContain("Globee");
    expect(ASK_GLOBEE.headline).toBe("Ask 24Frame AI");
  });
});

describe("profile opt-in", () => {
  it("builds a self insert with required donor columns only", () => {
    const row = profileInsertRow({
      userId: "u1",
      handle: "ada",
      displayName: "Ada",
      birthDate: "1990-01-02",
    });
    expect(row.id).toBe("u1");
    expect(row.handle).toBe("ada");
    expect(row.display_name).toBe("Ada");
    expect(row.birth_date).toBe("1990-01-02");
    expect(row.app_role).toBe("member");
    expect(row.points_total).toBe(0);
    expect(row.level).toBe(1);
    expect(row.status).toBe("active");
    expect(row.trust_state).toBe("new");
    expect(row).not.toHaveProperty("avatar_key");
    expect(row).not.toHaveProperty("org_id");
  });

  it("omits birth_date when ensure creates the row", () => {
    const row = profileInsertRow({
      userId: "u1",
      handle: "ada",
      displayName: "Ada",
    });
    expect(row).not.toHaveProperty("birth_date");
    expect(row.handle).toBe("ada");
  });

  it("rejects short handles and under-13 birth dates", () => {
    expect(normalizeHandle("ab")).toBeNull();
    expect(normalizeHandle("Ada_Lovelace")).toBe("ada_lovelace");
    expect(isEligibleBirthDate("2014-01-01", new Date("2026-09-12T00:00:00.000Z"))).toBe(false);
    expect(isEligibleBirthDate("2013-09-12", new Date("2026-09-12T00:00:00.000Z"))).toBe(true);
    expect(socialInitials("Ada Lovelace")).toBe("AL");
  });

  it("strips @ from handle input and keeps the house profile URL stable", () => {
    expect(stripHandleDecorators("@@acarpcreate")).toBe("acarpcreate");
    expect(normalizeHandle("@Ada_Lovelace")).toBe("ada_lovelace");
    expect(normalizeHandle("@@acarpcreate")).toBe("acarpcreate");
    expect(displayHandle("ada")).toBe("@ada");
    expect(handleFieldValue("acarpcreate")).toBe("@acarpcreate");
    expect(handleFieldValue("")).toBe("@");
    expect(socialHandleRequiredError("")).toBe(SOCIAL.profile.handleRequired);
    expect(socialHandleRequiredError("@")).toBe(SOCIAL.profile.handleRequired);
    expect(socialHandleRequiredError("@@@")).toBe(SOCIAL.profile.handleRequired);
    expect(socialHandleRequiredError("@ada")).toBeNull();
    expect(socialProfileHref("Ada")).toBe("/social/u/@ada");
    expect(socialProfileHref("@acarpcreate")).toBe("/social/u/@acarpcreate");
    expect(socialProfilePublicUrl("acarpcreate")).toBe("https://24frame.co/@acarpcreate");
    expect(socialProfilePublicUrl("")).toBe("https://24frame.co/@");
    expect(socialProfilePublicUrl("@Ada")).toBe("https://24frame.co/@ada");
    expect(SOCIAL_PROFILE_ORIGIN).toBe("https://24frame.co");
    expect(socialProfilePublicUrl("acarpcreate")).not.toContain("app.24frame.co");
    expect(socialProfilePublicUrl("acarpcreate")).not.toContain("/social/u/");
    expect(parseProfileHandleParam("%40ada")).toBe("ada");
    expect(parseProfileHandleParam("@ada")).toBe("ada");
    expect(suggestedHandleSeed("Ada.Carp@example.com", "u1")).toBe("adacarp");
  });
});

describe("social writes stay on the live spine", () => {
  it("posts text and optional media keys and likes target posts", () => {
    expect(postInsertRow({ authorId: "u1", body: "hello" })).toEqual({
      author_id: "u1",
      body: "hello",
      group_id: null,
      media: [],
      category: null,
      status: "active",
      like_count: 0,
      comment_count: 0,
      pinned: false,
    });
    expect(
      postInsertRow({
        authorId: "u1",
        body: null,
        media: [{ kind: "image", key: "posts/u1/a.jpg", contentType: "image/jpeg" }],
      }),
    ).toMatchObject({
      body: null,
      media: [{ kind: "image", key: "posts/u1/a.jpg", contentType: "image/jpeg" }],
    });
    expect(likeInsertRow("u1", "p1")).toEqual({
      user_id: "u1",
      target_type: "post",
      target_id: "p1",
    });
    expect(messageInsertRow({ senderId: "u1", conversationId: "c1", body: "hi" })).toEqual({
      sender_id: "u1",
      conversation_id: "c1",
      body: "hi",
      status: "active",
    });
  });

  it("does not invent a cousin catalog feed table or cascade-delete memberships", () => {
    const actions = readFileSync("src/app/(app)/social/actions.ts", "utf8");
    const pages = readFileSync("src/app/(app)/social/page.tsx", "utf8");
    const board = readFileSync("src/app/(app)/social/leaderboard/page.tsx", "utf8");
    expect(actions).toContain('from("profiles")');
    expect(actions).toContain('from("posts")');
    expect(actions).toContain("presignSocialMediaPut");
    expect(actions).toContain('from("likes")');
    expect(actions).not.toContain("from \"@/lib/s3\"");
    expect(actions).not.toContain("from \"@/lib/cloudfront\"");
    expect(actions).not.toContain("from \"@/lib/mediaconvert\"");
    expect(actions).toContain("open_or_get_direct_conversation");
    expect(actions).toContain("add_conversation_participants");
    expect(actions).toContain("set_group_conversation_title");
    expect(actions).toContain("mark_direct_conversation_read");
    expect(actions).not.toContain("min_level");
    expect(actions).toContain("createClient");
    expect(actions).not.toContain("createAdminClient");
    expect(actions).not.toContain("service_role");
    expect(actions).not.toContain('from("titles")');
    expect(actions).not.toContain("ai_conversations");
    expect(actions).not.toContain("memberships");
    expect(actions).not.toContain(".from(\"profiles\").delete");
    expect(actions).not.toContain("from(\"organizations\")");
    expect(pages).toContain("loadFollowingPosts");
    expect(pages).not.toContain("SocialPostCompose");
    expect(pages).toContain("SocialLensRow");
    expect(pages).toContain("SocialStoriesRail");
    expect(pages).not.toContain("from(\"titles\")");
    expect(board).toContain("loadLeaderboardBoard");
    expect(board).toContain("createClient");
    expect(board).not.toContain("createAdminClient");
    expect(board).not.toContain("rebuild_leaderboards");
    expect(actions).not.toContain("from(\"courses\")");
    expect(actions).not.toContain("createSocialCourse");
  });

  it("labels rooms from participants first and quiets add-people errors", () => {
    expect(conversationRoomLabel(null, ["Ada Lovelace", "Bob One"])).toBe("Ada Lovelace, Bob One");
    expect(conversationRoomLabel("Desk room", ["Ada Lovelace"])).toBe("Desk room");
    expect(conversationRoomLabel("  ", [])).toBe(SOCIAL.dms.thread);
    expect(inboxPeerIds({ peer_id: "u2", participant_ids: ["u2", "u3"] })).toEqual(["u2", "u3"]);
    expect(inboxPeerIds({ peer_id: "u2", participant_ids: [] })).toEqual(["u2"]);
    expect(normalizeConversationTitle("")).toEqual({ title: null });
    expect(normalizeConversationTitle("Desk room")).toEqual({ title: "Desk room" });
    expect(normalizeConversationTitle("x".repeat(81))).toBeNull();
    expect(quietDmAddError("blocked")).toBe(SOCIAL.dms.addBlocked);
    expect(quietDmAddError("cannot add yourself")).toBe(SOCIAL.dms.addSelf);
    expect(quietDmAddError("peer not found")).toBe(SOCIAL.dms.addMissing);
  });

  it("reuses signed account faces and does not add a second upload or title bucket", () => {
    const surfaces = [
      "src/app/(app)/social/page.tsx",
      "src/app/(app)/social/profile/page.tsx",
      "src/app/(app)/social/u/[handle]/page.tsx",
      "src/app/(app)/social/dms/page.tsx",
      "src/app/(app)/social/dms/[id]/page.tsx",
      "src/app/(app)/social/leaderboard/page.tsx",
      "src/app/(app)/social/groups/[slug]/page.tsx",
      "src/app/(app)/social/groups/[slug]/posts/[postId]/page.tsx",
      "src/app/(app)/social/stories/[id]/page.tsx",
    ];
    for (const file of surfaces) {
      const src = readFileSync(file, "utf8");
      expect(src).toMatch(/signedAvatarUrls?/);
      expect(src).not.toContain("putAvatarObject");
      expect(src).not.toContain("uploadAccountPhoto");
      expect(src).not.toContain("S3_BUCKET");
      expect(src).not.toContain("S3_AVATARS_BUCKET");
      expect(src).not.toContain("24frame-media");
      expect(src).not.toContain("@/lib/s3\"");
      expect(src).not.toContain("@/lib/cloudfront");
      expect(src).not.toContain("@/lib/mediaconvert");
    }
    const feed = [
      "src/app/(app)/social/page.tsx",
      "src/app/(app)/social/groups/[slug]/page.tsx",
      "src/app/(app)/social/groups/[slug]/posts/[postId]/page.tsx",
      "src/app/(app)/social/stories/[id]/page.tsx",
    ];
    for (const file of feed) {
      expect(readFileSync(file, "utf8")).toMatch(/signedSocialMedia/);
    }
    const forms = readFileSync("src/components/social/social-forms.tsx", "utf8");
    expect(forms).toContain("presignSocialMediaUpload");
    expect(forms).toContain("type=\"file\"");
    expect(forms).not.toContain("S3_BUCKET");
    expect(forms).not.toContain("from \"@/lib/s3\"");
    expect(forms).not.toContain("from \"@/lib/cloudfront\"");
  });
});
