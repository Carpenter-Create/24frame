import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SOCIAL_MUX_PROVIDER } from "@/lib/social-mux";
import {
  dmPostComment,
  dmPostInboxExcerpt,
  postDmInsertRow,
  postShareAttemptContains,
  postShareAttemptId,
  postShareCaptionSnip,
  postShareFailureCopy,
  postSharePeerAllowed,
  postSharePeerIds,
  postSharePermalink,
  postShareSheetError,
  postShareUiAfter,
  presentDmPostShare,
  recipientMayViewPost,
  POST_SHARE_CAPTION_SNIP,
  POST_SHARE_RECIPIENT_CAP,
} from "@/lib/social-post-share";

const ATTEMPT = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const author = "11111111-1111-4111-8111-111111111111";
const objectId = "22222222-2222-4222-8222-222222222222";

const muxVideo = {
  kind: "video" as const,
  key: `posts/${author}/${objectId}.mp4`,
  contentType: "video/mp4" as const,
  provider: SOCIAL_MUX_PROVIDER,
  playbackId: "abc12345xx",
};

const fileVideo = {
  kind: "video" as const,
  key: `posts/${author}/${objectId}.mp4`,
  contentType: "video/mp4" as const,
};

describe("post DM share card", () => {
  it("stores a caption snip and an optional note, never a post URL", () => {
    const row = postDmInsertRow({
      senderId: "u1",
      conversationId: "conv-1",
      postId: "p1",
      authorId: author,
      authorHandle: "ada",
      caption: "DO YALL KNOW\nthis line",
      note: "watch this",
      media: [muxVideo],
    });
    expect(row.body).toBe("watch this");
    expect(row.body).not.toMatch(/\/social\/p\/|https?:/);
    expect(row.media.at(-1)).toMatchObject({
      kind: "post-share",
      postId: "p1",
      authorId: author,
      authorHandle: "ada",
      caption: "DO YALL KNOW this line",
    });
    expect(dmPostComment(row)).toBe("watch this");
    const card = presentDmPostShare(row);
    expect(card).toMatchObject({
      postId: "p1",
      kind: "video",
      playbackId: "abc12345xx",
      url: null,
      caption: "DO YALL KNOW this line",
    });
    expect(JSON.stringify(card)).not.toMatch(/\/social\/p\/|https?:/);
  });

  it("uses the system line when the note is empty", () => {
    const row = postDmInsertRow({
      senderId: "u1",
      conversationId: "conv-1",
      postId: "p1",
      authorId: author,
      authorHandle: "ada",
      caption: "hello",
      media: [muxVideo],
    });
    expect(row.body).toBe(SOCIAL.dms.youSentPost("ada"));
    expect(dmPostComment(row)).toBeNull();
  });

  it("refuses a file video and keeps the caption", () => {
    const row = postDmInsertRow({
      senderId: "u1",
      conversationId: "conv-1",
      postId: "p1",
      authorId: author,
      authorHandle: "ada",
      caption: "still words",
      media: [fileVideo],
    });
    const card = presentDmPostShare(row);
    expect(card).toMatchObject({ kind: null, url: null, playbackId: undefined, caption: "still words" });
    expect(JSON.stringify(card)).not.toMatch(/\/api\/social\/media|<video/);
  });

  it("snips a long caption on a word boundary", () => {
    const words = Array.from({ length: 40 }, () => "caption").join(" ");
    const snip = postShareCaptionSnip(words);
    expect(snip).toBeTruthy();
    expect(snip!.length).toBeLessThanOrEqual(POST_SHARE_CAPTION_SNIP + 1);
    expect(snip!.endsWith("…")).toBe(true);
    expect(snip).not.toMatch(/captio…$/);
  });

  it("caps recipients and drops blanks", () => {
    expect(postSharePeerIds([" u2 ", "u2", "", "u3"])).toEqual({ ok: true, ids: ["u2", "u3"] });
    expect(postSharePeerIds([" "])).toEqual({ ok: false, error: "empty" });
    const many = Array.from({ length: POST_SHARE_RECIPIENT_CAP + 1 }, (_, index) => `u${index}`);
    expect(postSharePeerIds(many)).toEqual({ ok: false, error: "cap" });
  });

  it("builds an in-app permalink and an inbox line that is not a URL", () => {
    expect(postSharePermalink("p1", "https://24frame.co/")).toBe("https://24frame.co/social/p/p1");
    const row = postDmInsertRow({
      senderId: "u1",
      conversationId: "conv-1",
      postId: "p1",
      authorId: author,
      authorHandle: "ada",
      media: [],
    });
    expect(
      dmPostInboxExcerpt({ ...row, senderId: "u1", viewerId: "u1" }),
    ).toBe(SOCIAL.dms.youSentPost("ada"));
    expect(
      dmPostInboxExcerpt({ ...row, senderId: "u1", viewerId: "u2" }),
    ).toBe(SOCIAL.dms.sentYouPost);
    expect(SOCIAL.dms.youSentPost("ada")).not.toMatch(/\/social\/p|https?:/);
    expect(postShareUiAfter({})).toEqual({ close: true, error: "" });
    expect(postShareUiAfter({ error: "no" }).close).toBe(false);
    expect(postShareUiAfter({ failedPeerIds: ["u2"], error: "no" }).close).toBe(false);
  });

  it("keeps one attempt on the marker and names the peers a retry must skip", () => {
    const row = postDmInsertRow({
      senderId: "u1",
      conversationId: "conv-1",
      postId: "p1",
      authorId: author,
      authorHandle: "ada",
      attemptId: ATTEMPT,
      media: [muxVideo],
    });
    expect(row.media.at(-1)).toMatchObject({ attemptId: ATTEMPT, kind: "post-share", postId: "p1" });
    expect(postShareAttemptId(ATTEMPT)).toBe(ATTEMPT);
    expect(postShareAttemptId("nope")).toBeNull();
    expect(postShareAttemptContains("p1", ATTEMPT)).toBe(
      JSON.stringify([{ kind: "post-share", postId: "p1", attemptId: ATTEMPT }]),
    );
    expect(postSharePeerAllowed("u2", new Set(["u2"]))).toBe(true);
    expect(postSharePeerAllowed("u9", new Set(["u2"]))).toBe(false);
    expect(recipientMayViewPost({ groupId: null, access: false })).toBe(true);
    expect(recipientMayViewPost({ groupId: "g1", access: true })).toBe(true);
    expect(recipientMayViewPost({ groupId: "g1", access: false })).toBe(false);
    expect(recipientMayViewPost({ groupId: "g1", access: null })).toBe(false);
    expect(recipientMayViewPost({ groupId: undefined, access: true })).toBe(false);
    expect(postShareFailureCopy([])).toBe(SOCIAL.post.shareFailed);
    expect(postShareFailureCopy(["Lauren"])).toBe(SOCIAL.post.shareFailedPeers("Lauren"));
    expect(
      postShareSheetError(
        { error: SOCIAL.post.shareFailed, failedPeerIds: ["u2"] },
        [{ id: "u2", name: "Lauren Montoya" }],
      ).error,
    ).toBe(SOCIAL.post.shareFailedPeers("Lauren Montoya"));
  });
});
