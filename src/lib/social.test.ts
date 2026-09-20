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
  parseSocialCreateKind,
  parseSocialHomeLane,
  parseSocialProfileTab,
  postInsertRow,
  profileInsertRow,
  quietDmAddError,
  SOCIAL,
  SOCIAL_BANNED_PRODUCT_NAMES,
  SOCIAL_PROFILE_ORIGIN,
  SOCIAL_ROUTES,
  socialComposerPrompt,
  socialCreateHref,
  socialCreateWellCopy,
  socialHandleRequiredError,
  socialHomeLaneHref,
  socialInitials,
  socialPersonIdentity,
  socialPublicDisplayName,
  socialMediaRuleMessage,
  formatSocialCount,
  socialProfileHref,
  socialProfilePublicHost,
  socialProfilePublicUrl,
  socialProfileRewriteTarget,
  socialProfileTabHref,
  socialProfileTabLabel,
  SOCIAL_PROFILE_TABS,
  socialVanityInternalPath,
  stripHandleDecorators,
  suggestedHandleSeed,
  BIO_MAX,
  normalizeBio,
  socialBioCount,
  socialBioCounterLabel,
  socialBioEnterSubmits,
  socialBioFieldValue,
} from "./social";

describe("social copy lock", () => {
  it("uses 24Frame workspace language and never names Globee as the product", () => {
    const blob = JSON.stringify({ SOCIAL, SOCIAL_ROUTES, SOCIAL_WORKSPACE });
    expect(blob).toContain(PRODUCT_NAME);
    expect(blob).toContain(SOCIAL_WORKSPACE);
    expect(SOCIAL.home.subtitle).toContain("follow");
    expect(SOCIAL.home.subtitle).toContain(PRODUCT_NAME);
    expect(SOCIAL.home.emptyQuiet).toBe("No posts yet");
    expect(SOCIAL.home.recentChats).toBe("Recent chats");
    expect(SOCIAL.home.chatsEmpty).toBe("No messages yet");
    expect(blob).not.toContain("Social-native");
    expect(blob).not.toContain("One clear next step");
    expect(SOCIAL.explore.subtitle).toContain(PRODUCT_NAME);
    expect(SOCIAL.explore.recent).toBe("Recent");
    expect(SOCIAL.explore.recentEmpty).toBe("No recent searches.");
    expect(SOCIAL.explore.searchBack).toBe("Back");
    expect(JSON.stringify(SOCIAL.explore)).not.toContain("Meta AI");
    expect(JSON.stringify(SOCIAL.explore)).not.toContain("Search with Meta AI");
    expect(SOCIAL_ROUTES.explore).toBe("/social/explore");
    expect(SOCIAL_ROUTES.create).toBe("/social/create");
      expect(SOCIAL_ROUTES.stories).toBe("/social/stories");
      expect(SOCIAL_ROUTES.storiesNew).toBe("/social/stories/new");
    expect(SOCIAL.stories.emptyHint).toContain("share stories");
    expect(SOCIAL.stories.createCta).toBe("Create a story");
    expect(SOCIAL.stories.reply).toBe("Reply quietly…");
    expect(SOCIAL.stories.subtitle).toBe("Add a video. It stays visible for 24 hours.");
    expect(SOCIAL.stories.empty).toBe("Add a video.");
    expect(SOCIAL.stories.attach).toBe("Add video");
    expect(SOCIAL.stories.mediaType).toBe("Use a video (MP4, QuickTime, WebM).");
    expect(SOCIAL.stories.mediaMissing).toBe("Choose a video first.");
    expect(SOCIAL.stories.pickerHint).toBe("Video only");
    expect(SOCIAL.stories.record).toBe("Record a video");
    expect(SOCIAL.stories.recordHint).toBe("Open in-app studio");
    expect(SOCIAL.stories.upload).toBe("Upload a video");
    expect(SOCIAL.stories.footnote).toBe("No photo story · No text story");
    expect(SOCIAL.stories.studioTitle).toBe("Story studio");
    expect(SOCIAL.stories.holdOrTap).toBe("Hold or tap to record");
    expect(SOCIAL.stories.post).toBe("Post");
    expect(SOCIAL.stories.posted).toBe("Story posted");
    expect(JSON.stringify(SOCIAL.stories)).not.toMatch(/photo or video/i);
    expect(JSON.stringify(SOCIAL.stories)).not.toMatch(/15 second/i);
    expect(socialMediaRuleMessage("type", "stories")).toBe(SOCIAL.stories.mediaType);
    expect(socialMediaRuleMessage("type")).toBe(SOCIAL.home.mediaType);
    const storyCompose = readFileSync("src/components/social/social-story-studio.tsx", "utf8");
    expect(storyCompose).toContain("SOCIAL_VIDEO_CONTENT_TYPES.join(\",\")");
    expect(storyCompose).toContain("getUserMedia");
    expect(storyCompose).toContain("MediaRecorder");
    expect(storyCompose).toContain("probeStoryRecorderMimeType");
    expect(storyCompose).toContain("data-social-story-record");
    expect(storyCompose).toContain("data-social-story-upload");
    expect(storyCompose).toContain("data-social-story-studio");
    expect(storyCompose).toContain("storyStudioMirrorsPreview");
    expect(storyCompose).toContain("storyRecorderVideoConstraints");
    expect(storyCompose).not.toContain("capture=\"user\"");
    expect(storyCompose).not.toContain("SOCIAL_MEDIA_ACCEPT");
    expect(SOCIAL.dms.subtitle).toContain(PRODUCT_NAME);
    expect(SOCIAL.dms.addPeople).toBe("Add people");
    expect(SOCIAL_ROUTES.dms).toBe("/social/dms");
    expect(SOCIAL_ROUTES.leaderboard).toBe("/social/leaderboard");
    expect(SOCIAL_ROUTES).not.toHaveProperty("courses");
    expect(SOCIAL_ROUTES.home).toBe("/social");
    expect(SOCIAL_ROUTES.profileByHandle).toBe("/social/u");
    expect(SOCIAL.profile.handlePlaceholder).toBe("Set your handle");
    expect(SOCIAL.profile.handleRequired).toBe("Handle is required");
    expect(SOCIAL_ROUTES.profileEdit).toBe("/social/profile/edit");
    expect(SOCIAL_ROUTES.profileBio).toBe("/social/profile/edit/bio");
    expect(SOCIAL.profile.username).toBe("Username");
    expect(SOCIAL.profile.bioPrivacy).toBe("Your bio shows on your public profile.");
    expect(SOCIAL.profile.addLink).toBe("Add link");
    expect(SOCIAL.profile.editPicture).toBe("Edit picture");
    expect(SOCIAL.profile.postsEmpty).toBe("No posts yet.");
    expect(SOCIAL.profile.postsTruncated).toContain("200");
    expect(SOCIAL.home.truncatedWall).toContain("50");
    expect(SOCIAL.home.truncatedFollowees).toContain("500");
    expect(SOCIAL.home.truncatedStories).toContain("80");
    expect(SOCIAL.explore.truncated).toContain("20");
    expect(SOCIAL.dms.truncatedInbox).toContain("50");
    expect(SOCIAL.dms.truncatedThread).toContain("50");
    expect(SOCIAL.dms.roomFull).toContain("32");
    expect(SOCIAL.dms.addBatch).toContain("32");
    expect(SOCIAL.dms.olderPage).toContain("older");
    expect(SOCIAL.dms.latestMessages).toBe("Latest messages");
    expect(SOCIAL.profile.uploadPhoto).toBe("Upload photo");
    expect(SOCIAL.profile.share).toBe("Share");
    expect(SOCIAL.profile.shareProfile).toBe("Share profile");
    expect(SOCIAL.profile.shareCopyLink).toBe("Copy link");
    expect(SOCIAL.profile.shareDownload).toBe("Download");
    expect(SOCIAL.courses.title).toBe("Education");
    expect(SOCIAL.courses.subtitle).toBe(`Education in ${PRODUCT_NAME}.`);
    expect(SOCIAL.courses.subtitle).not.toContain("Social+Education");
    expect(SOCIAL.courses.empty).toBe("Nothing here yet.");
    expect(SOCIAL.courses.playlist).toBe("Playlist");
    expect(SOCIAL.courses.lessonOne).toBe("1 lesson");
    expect(SOCIAL.courses.error).toBe("Education could not be loaded.");
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
    expect(row.discoverable).toBe(true);
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

  it("treats Member as an empty person name and keeps handle primary", () => {
    expect(SOCIAL.member.title).toBe("Member");
    expect(SOCIAL.profile.defaultDisplayName).toBe("Member");
    expect(socialPublicDisplayName("Ada Lovelace")).toBe("Ada Lovelace");
    expect(socialPublicDisplayName("Member")).toBeNull();
    expect(socialPublicDisplayName("  Member  ")).toBeNull();
    expect(socialPublicDisplayName("")).toBeNull();
    const named = socialPersonIdentity({ handle: "joshua", displayName: "Joshua A" });
    expect(named.handleLabel).toBe("@joshua");
    expect(named.name).toBe("Joshua A");
    expect(named.label).toBe("Joshua A");
    const sentinel = socialPersonIdentity({ handle: "joshua", displayName: "Member" });
    expect(sentinel.handleLabel).toBe("@joshua");
    expect(sentinel.name).toBeNull();
    expect(sentinel.label).toBe("joshua");
    expect(sentinel.avatarName).toBe("joshua");
    expect(JSON.stringify(sentinel)).not.toContain("Member");
    const sameAsHandle = socialPersonIdentity({ handle: "joshua", displayName: "joshua" });
    expect(sameAsHandle.name).toBeNull();
    expect(sameAsHandle.label).toBe("joshua");
    const casedName = socialPersonIdentity({ handle: "other", displayName: "Other" });
    expect(casedName.name).toBe("Other");
    expect(casedName.label).toBe("Other");
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
    expect(socialProfileHref("Ada")).toBe("/social/u/ada");
    expect(socialProfileHref("@acarpcreate")).toBe("/social/u/acarpcreate");
    expect(socialProfileHref("Ada")).not.toMatch(/\/social\/u\/@/);
    expect(socialProfileHref("@acarpcreate")).not.toMatch(/\/social\/u\/@/);
    const hrefSrc = readFileSync("src/lib/social.ts", "utf8");
    expect(hrefSrc).toContain("${SOCIAL_ROUTES.profileByHandle}/${bare}");
    expect(hrefSrc).not.toContain("${SOCIAL_ROUTES.profileByHandle}/@${bare}");
    expect(socialProfilePublicUrl("acarpcreate")).toBe("https://24frame.co/@acarpcreate");
    expect(socialProfilePublicHost("acarpcreate")).toBe("24frame.co/@acarpcreate");
    expect(formatSocialCount(24)).toBe("24");
    expect(formatSocialCount(1200)).toBe("1.2k");
    expect(formatSocialCount(318)).toBe("318");
    expect(socialProfilePublicUrl("")).toBe("https://24frame.co/@");
    expect(socialProfilePublicUrl("@Ada")).toBe("https://24frame.co/@ada");
    expect(SOCIAL_PROFILE_ORIGIN).toBe("https://24frame.co");
    expect(socialProfilePublicUrl("acarpcreate")).not.toContain("app.24frame.co");
    expect(socialProfilePublicUrl("acarpcreate")).not.toContain("/social/u/");
    expect(parseSocialCreateKind("photo")).toBe("photo");
    expect(parseSocialCreateKind("clip")).toBeNull();
    expect(socialCreateHref("video")).toBe("/social/create?kind=video");
    expect(socialCreateHref("text")).toBe("/social/create?kind=text");
    expect(socialCreateWellCopy("photo", false)).toEqual({
      title: SOCIAL.create.dropEmpty,
      hint: SOCIAL.create.dropEmptyHint,
    });
    expect(socialCreateWellCopy("photo", true)?.title).toBe(SOCIAL.create.dropPhoto);
    expect(socialCreateWellCopy("video", false)?.title).toBe(SOCIAL.create.dropVideo);
    expect(socialCreateWellCopy("text", false)).toBeNull();
    expect(SOCIAL.create.photo).toBe("Photo");
    expect(SOCIAL.create.caption).toBe("Caption");
    expect(parseSocialHomeLane("for-you")).toBe("for-you");
    expect(socialHomeLaneHref("following")).toBe("/social");
    expect(SOCIAL_PROFILE_TABS).toEqual(["posts", "highlights", "credits"]);
    expect(parseSocialProfileTab("highlights")).toBe("highlights");
    expect(parseSocialProfileTab("credits")).toBe("credits");
    expect(parseSocialProfileTab("reels")).toBe("posts");
    expect(socialProfileTabHref("/social/u/ada", "highlights")).toBe("/social/u/ada?tab=highlights");
    expect(socialProfileTabHref("/social/u/ada", "credits")).toBe("/social/u/ada?tab=credits");
    expect(socialProfileTabHref("/social/profile", "posts")).toBe("/social/profile");
    expect(socialProfileTabLabel("credits")).toBe("Credits");
    expect(socialComposerPrompt("Ada Lovelace")).toBe("What's on your mind Ada?");
    expect(SOCIAL.profile.postsTab).toBe("Posts");
    expect(SOCIAL.profile.highlightsTab).toBe("Highlights");
    expect(SOCIAL.profile.creditsTab).toBe("Credits");
    expect(SOCIAL.profile.creditsEmpty).toBe("No credits yet");
    expect(parseProfileHandleParam("%40ada")).toBe("ada");
    expect(parseProfileHandleParam("@ada")).toBe("ada");
    expect(parseProfileHandleParam("ada")).toBe("ada");
    expect(suggestedHandleSeed("Ada.Carp@example.com", "u1")).toBe("adacarp");
    expect(BIO_MAX).toBe(150);
    expect(socialBioEnterSubmits()).toBe(false);
    expect(socialBioFieldValue("line1\r\nline2")).toBe("line1\nline2");
    expect(normalizeBio("Founder\nInvestor")).toBe("Founder\nInvestor");
    expect(socialBioCount("Founder\nInvestor")).toBe(16);
    expect(socialBioCounterLabel("Founder\nInvestor")).toBe("16 / 150");
    expect(normalizeBio(`${"a".repeat(150)}\n`)).toBe("a".repeat(150));
    expect(normalizeBio(`a\n${"b".repeat(149)}`)).toBeNull();
    expect(normalizeBio("   \n  ")).toBe("");
    expect(normalizeBio("hello\n")).toBe("hello");
  });

  it("rewrites only /@handle to the in-app /social/u/{bare} profile", () => {
    expect(socialVanityInternalPath("/@ada")).toBe("/social/u/ada");
    expect(socialVanityInternalPath("/@Ada_Lovelace")).toBe("/social/u/ada_lovelace");
    expect(socialVanityInternalPath("/@ada")).not.toMatch(/\/social\/u\/@/);
    expect(socialVanityInternalPath("/@ada/extra")).toBeNull();
    expect(socialVanityInternalPath("/legal")).toBeNull();
    expect(socialVanityInternalPath("/login")).toBeNull();
    expect(socialVanityInternalPath("/admin")).toBeNull();
    expect(socialVanityInternalPath("/api")).toBeNull();
    expect(socialVanityInternalPath("/www")).toBeNull();
    expect(socialVanityInternalPath("/@login")).toBeNull();
    expect(socialVanityInternalPath("/@legal")).toBeNull();
    expect(socialVanityInternalPath("/@admin")).toBeNull();
    expect(socialVanityInternalPath("/@api")).toBeNull();
    expect(socialVanityInternalPath("/@www")).toBeNull();
  });

  it("rewrites leftover /social/u/@handle bookmarks to the bare in-app route", () => {
    expect(socialProfileRewriteTarget("/@ada")).toBe("/social/u/ada");
    expect(socialProfileRewriteTarget("/social/u/@ada")).toBe("/social/u/ada");
    expect(socialProfileRewriteTarget("/social/u/%40ada")).toBe("/social/u/ada");
    expect(socialProfileRewriteTarget("/social/u/@acarpcreate")).toBe("/social/u/acarpcreate");
    expect(socialProfileRewriteTarget("/social/u/ada")).toBeNull();
    expect(socialProfileRewriteTarget("/social/u/@ada/extra")).toBeNull();
    expect(socialProfileRewriteTarget("/social/u/@login")).toBe("/social/u/login");
    expect(socialProfileRewriteTarget("/@login")).toBeNull();
    expect(socialProfileRewriteTarget("/social/u/@ada")).not.toMatch(/\/social\/u\/@/);
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
    expect(pages).toContain("SocialHomeTabs");
    expect(pages).toContain("SocialHomeComposer");
    expect(pages).not.toContain("SocialLensRow");
    expect(pages).toContain("SocialStoriesRail");
    expect(pages).not.toContain("from(\"titles\")");
    expect(board).toContain("loadLeaderboardBoard");
    expect(board).toContain("requireSocialSession");
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
    expect(quietDmAddError("room is full")).toBe(SOCIAL.dms.roomFull);
    expect(quietDmAddError("too many participants in one add")).toBe(SOCIAL.dms.addBatch);
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
      "src/app/(app)/social/profile/page.tsx",
      "src/app/(app)/social/u/[handle]/page.tsx",
      "src/app/(app)/social/groups/[slug]/page.tsx",
      "src/app/(app)/social/groups/[slug]/posts/[postId]/page.tsx",
      "src/app/(app)/social/stories/[id]/page.tsx",
    ];
    for (const file of feed) {
      expect(readFileSync(file, "utf8")).toMatch(/signedSocialMedia/);
    }
    const own = readFileSync("src/app/(app)/social/profile/page.tsx", "utf8");
    const pub = readFileSync("src/app/(app)/social/u/[handle]/page.tsx", "utf8");
    expect(own).toContain("loadAuthorPosts");
    expect(own).toContain("SocialAuthorHistory");
    expect(pub).toContain("loadAuthorPosts");
    expect(pub).toContain("SocialAuthorHistory");
    const forms = readFileSync("src/components/social/social-forms.tsx", "utf8");
    expect(forms).toContain("presignSocialMediaUpload");
    expect(forms).toContain("uploadAccountPhoto");
    expect(forms).toContain("type=\"file\"");
    expect(forms).not.toContain("putAvatarObject");
    expect(forms).not.toContain("S3_BUCKET");
    expect(forms).not.toContain("S3_AVATARS_BUCKET");
    expect(forms).not.toContain("from \"@/lib/s3\"");
    expect(forms).not.toContain("from \"@/lib/cloudfront\"");
  });
});
