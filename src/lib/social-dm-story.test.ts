import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SOCIAL_MUX_PROVIDER } from "@/lib/social-mux";
import {
  dmStoryInboxExcerpt,
  presentDmStoryShare,
  storyDmInsertRow,
} from "@/lib/social-dm-story";

const author = "11111111-1111-4111-8111-111111111111";
const objectId = "22222222-2222-4222-8222-222222222222";

const video = {
  kind: "video" as const,
  key: `stories/${author}/${objectId}.mp4`,
  contentType: "video/mp4" as const,
  provider: SOCIAL_MUX_PROVIDER,
  playbackId: "abc12345xx",
};

describe("story DM card", () => {
  it("plays a story video through the live host, not a poster or a URL", () => {
    const row = storyDmInsertRow({
      senderId: "u1",
      conversationId: "conv-1",
      storyId: "s1",
      authorId: author,
      expiresAt: "2099-01-01T00:00:00.000Z",
      media: [video],
    });
    const card = presentDmStoryShare({ body: row.body, media: row.media });
    expect(card).toMatchObject({
      unavailable: false,
      kind: "video",
      playbackId: "abc12345xx",
      href: null,
    });
    expect(card?.url).toBeTruthy();
    expect(JSON.stringify(card)).not.toMatch(/\/social\/stories/);
  });

  it("keeps a photo on the story viewer href and hides an expired story", () => {
    const still = {
      kind: "image" as const,
      key: `stories/${author}/${objectId}.jpg`,
      contentType: "image/jpeg" as const,
    };
    const live = presentDmStoryShare({
      body: "Sent a story",
      media: [
        still,
        {
          kind: "story-share",
          storyId: "s1",
          authorId: author,
          expiresAt: "2099-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(live).toMatchObject({ kind: "image", href: "/social/stories/s1", unavailable: false });

    const expired = presentDmStoryShare({
      body: "/social/stories/s1",
      media: [still],
      live: null,
    });
    expect(expired).toMatchObject({ unavailable: true, href: null, kind: null, url: null });
    expect(JSON.stringify(expired)).not.toMatch(/\/social\/stories/);
  });

  it("inbox lines never echo a story URL", () => {
    expect(
      dmStoryInboxExcerpt({
        body: "https://24frame.co/social/stories/s1",
        media: [],
        senderId: "u2",
        viewerId: "u1",
      }),
    ).toBe(SOCIAL.dms.sentYouStory);
    expect(
      dmStoryInboxExcerpt({
        body: "Sent a story",
        media: [
          {
            kind: "story-share",
            storyId: "s1",
            authorId: author,
            expiresAt: "2099-01-01T00:00:00.000Z",
          },
        ],
        senderId: "u1",
        viewerId: "u1",
      }),
    ).toBe(SOCIAL.dms.sentStory);
    expect(
      dmStoryInboxExcerpt({
        body: "hello",
        media: [],
        senderId: "u2",
        viewerId: "u1",
      }),
    ).toBeNull();
    expect(SOCIAL.dms.sentStory).not.toMatch(/\/social\/stories|https?:/);
    expect(SOCIAL.dms.sentYouStory).not.toMatch(/\/social\/stories|https?:/);
    expect(SOCIAL.dms.storyUnavailable).toBe("Story unavailable");
  });
});
