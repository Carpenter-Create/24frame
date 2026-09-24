import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { socialMediaReadGrant, viewerMaySignSocialMedia } from "@/lib/social-media-access";

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "33333333-3333-4333-8333-333333333333";
const OBJECT = "22222222-2222-4222-8222-222222222222";
const STORY_KEY = `stories/${OTHER}/${OBJECT}.mp4`;
const POST_KEY = `posts/${OTHER}/${OBJECT}.jpg`;
const NOW = new Date("2026-09-24T00:00:00.000Z");
const LIVE = "2026-09-25T00:00:00.000Z";
const EXPIRED = "2026-09-23T00:00:00.000Z";

function storyMedia(key = STORY_KEY) {
  return [{ kind: "video", key, contentType: "video/mp4" }];
}

function postMedia(key = POST_KEY) {
  return [{ kind: "image", key, contentType: "image/jpeg" }];
}

function chain(result: { data: unknown; error?: { message: string } | null }) {
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  builder.select = vi.fn(self);
  builder.eq = vi.fn(self);
  builder.gt = vi.fn(self);
  builder.contains = vi.fn(self);
  builder.limit = vi.fn(self);
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return builder;
}

describe("socialMediaReadGrant", () => {
  it("allows a posts-lane object the caller owns before a row exists", () => {
    expect(
      socialMediaReadGrant({
        userId: USER,
        key: `posts/${USER}/${OBJECT}.jpg`,
        now: NOW,
      }),
    ).toBe(true);
  });

  it("does not sign a story key from prefix ownership alone", () => {
    const own = `stories/${USER}/${OBJECT}.mp4`;
    expect(socialMediaReadGrant({ userId: USER, key: own, now: NOW })).toBe(false);
    expect(
      socialMediaReadGrant({
        userId: USER,
        key: own,
        now: NOW,
        stories: [{ author_id: USER, status: "active", expires_at: EXPIRED, media: storyMedia(own) }],
      }),
    ).toBe(false);
  });

  it("allows a live story the caller follows when the key is on that story", () => {
    expect(
      socialMediaReadGrant({
        userId: USER,
        key: STORY_KEY,
        now: NOW,
        followeeIds: [OTHER],
        stories: [{ author_id: OTHER, status: "active", expires_at: LIVE, media: storyMedia() }],
      }),
    ).toBe(true);
  });

  it("allows the author's own live story without a follow row", () => {
    const own = `stories/${USER}/${OBJECT}.mp4`;
    expect(
      socialMediaReadGrant({
        userId: USER,
        key: own,
        now: NOW,
        followeeIds: [],
        stories: [{ author_id: USER, status: "active", expires_at: LIVE, media: storyMedia(own) }],
      }),
    ).toBe(true);
  });

  it("fails closed for expired, unfollowed, inactive, or mismatched story keys", () => {
    const base = {
      userId: USER,
      key: STORY_KEY,
      now: NOW,
      followeeIds: [OTHER],
    };
    expect(
      socialMediaReadGrant({
        ...base,
        stories: [{ author_id: OTHER, status: "active", expires_at: EXPIRED, media: storyMedia() }],
      }),
    ).toBe(false);
    expect(
      socialMediaReadGrant({
        ...base,
        followeeIds: [],
        stories: [{ author_id: OTHER, status: "active", expires_at: LIVE, media: storyMedia() }],
      }),
    ).toBe(false);
    expect(
      socialMediaReadGrant({
        ...base,
        stories: [{ author_id: OTHER, status: "removed", expires_at: LIVE, media: storyMedia() }],
      }),
    ).toBe(false);
    expect(
      socialMediaReadGrant({
        ...base,
        stories: [
          {
            author_id: OTHER,
            status: "active",
            expires_at: LIVE,
            media: storyMedia(`stories/${OTHER}/44444444-4444-4444-8444-444444444444.mp4`),
          },
        ],
      }),
    ).toBe(false);
    expect(socialMediaReadGrant({ ...base, stories: [] })).toBe(false);
    expect(socialMediaReadGrant({ userId: USER, key: "avatars/secret", now: NOW })).toBe(false);
    expect(socialMediaReadGrant({ userId: "", key: STORY_KEY, now: NOW })).toBe(false);
  });

  it("allows an active post the session can read and denies a post that is not active", () => {
    expect(
      socialMediaReadGrant({
        userId: USER,
        key: POST_KEY,
        now: NOW,
        posts: [{ author_id: OTHER, status: "active", media: postMedia() }],
      }),
    ).toBe(true);
    expect(
      socialMediaReadGrant({
        userId: USER,
        key: POST_KEY,
        now: NOW,
        posts: [{ author_id: OTHER, status: "removed", media: postMedia() }],
      }),
    ).toBe(false);
    expect(
      socialMediaReadGrant({
        userId: USER,
        key: POST_KEY,
        now: NOW,
        posts: [{ author_id: OTHER, status: "hidden", media: postMedia() }],
      }),
    ).toBe(false);
    expect(socialMediaReadGrant({ userId: USER, key: POST_KEY, now: NOW, posts: [] })).toBe(false);
  });

  it("allows a readable profile cover or welcome that the profile owns", () => {
    expect(
      socialMediaReadGrant({
        userId: USER,
        key: POST_KEY,
        now: NOW,
        profiles: [{ id: OTHER, cover_key: POST_KEY, welcome_video_key: null }],
      }),
    ).toBe(true);
    const welcome = `posts/${OTHER}/${OBJECT}.mp4`;
    expect(
      socialMediaReadGrant({
        userId: USER,
        key: welcome,
        now: NOW,
        profiles: [{ id: OTHER, cover_key: null, welcome_video_key: welcome }],
      }),
    ).toBe(true);
  });

  it("does not treat a foreign key stored on a profile as published media", () => {
    expect(
      socialMediaReadGrant({
        userId: USER,
        key: POST_KEY,
        now: NOW,
        profiles: [{ id: USER, cover_key: POST_KEY, welcome_video_key: POST_KEY }],
      }),
    ).toBe(false);
    expect(
      socialMediaReadGrant({
        userId: USER,
        key: POST_KEY,
        now: NOW,
        profiles: [{ id: OTHER, cover_key: `posts/${OTHER}/44444444-4444-4444-8444-444444444444.jpg` }],
      }),
    ).toBe(false);
  });
});

describe("viewerMaySignSocialMedia", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("does not query for a posts-lane key the caller owns", async () => {
    await expect(viewerMaySignSocialMedia(USER, `posts/${USER}/${OBJECT}.jpg`, NOW)).resolves.toBe(true);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("requires a live story row for the author's own story key", async () => {
    const own = `stories/${USER}/${OBJECT}.mp4`;
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "follows") return chain({ data: null });
        return chain({ data: [] });
      }),
    } as never);
    await expect(viewerMaySignSocialMedia(USER, own, NOW)).resolves.toBe(false);

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "follows") return chain({ data: null });
        return chain({
          data: [{ author_id: USER, status: "active", expires_at: EXPIRED, media: storyMedia(own) }],
        });
      }),
    } as never);
    await expect(viewerMaySignSocialMedia(USER, own, NOW)).resolves.toBe(false);

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "follows") return chain({ data: null });
        return chain({
          data: [{ author_id: USER, status: "active", expires_at: LIVE, media: storyMedia(own) }],
        });
      }),
    } as never);
    await expect(viewerMaySignSocialMedia(USER, own, NOW)).resolves.toBe(true);
  });

  it("signs a followed live story and refuses when the queries fail or return nothing", async () => {
    const from = vi.fn((table: string) => {
      if (table === "follows") return chain({ data: { followee_id: OTHER } });
      if (table === "stories") {
        return chain({
          data: [{ author_id: OTHER, status: "active", expires_at: LIVE, media: storyMedia() }],
        });
      }
      return chain({ data: [] });
    });
    vi.mocked(createClient).mockResolvedValue({ from } as never);
    await expect(viewerMaySignSocialMedia(USER, STORY_KEY, NOW)).resolves.toBe(true);

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "follows") return chain({ data: null, error: { message: "denied" } });
        return chain({ data: [] });
      }),
    } as never);
    await expect(viewerMaySignSocialMedia(USER, STORY_KEY, NOW)).resolves.toBe(false);

    vi.mocked(createClient).mockRejectedValue(new Error("no session"));
    await expect(viewerMaySignSocialMedia(USER, STORY_KEY, NOW)).resolves.toBe(false);
  });

  it("refuses an expired story and a story the caller does not follow", async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "follows") return chain({ data: { followee_id: OTHER } });
        return chain({
          data: [{ author_id: OTHER, status: "active", expires_at: EXPIRED, media: storyMedia() }],
        });
      }),
    } as never);
    await expect(viewerMaySignSocialMedia(USER, STORY_KEY, NOW)).resolves.toBe(false);

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "follows") return chain({ data: null });
        return chain({
          data: [{ author_id: OTHER, status: "active", expires_at: LIVE, media: storyMedia() }],
        });
      }),
    } as never);
    await expect(viewerMaySignSocialMedia(USER, STORY_KEY, NOW)).resolves.toBe(false);
  });

  it("signs an active post the session can read and refuses a random key", async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "posts") {
          return chain({
            data: [{ author_id: OTHER, status: "active", media: postMedia() }],
          });
        }
        return chain({ data: null });
      }),
    } as never);
    await expect(viewerMaySignSocialMedia(USER, POST_KEY, NOW)).resolves.toBe(true);

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => chain({ data: tableDataEmpty() })),
    } as never);
    await expect(viewerMaySignSocialMedia(USER, POST_KEY, NOW)).resolves.toBe(false);
    await expect(viewerMaySignSocialMedia(USER, "not-a-media-key", NOW)).resolves.toBe(false);
    expect(createClient).toHaveBeenCalledTimes(2);
  });

  it("signs a profile cover the session can read and refuses a stuffed foreign key", async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") return chain({ data: { id: OTHER, cover_key: POST_KEY, welcome_video_key: null } });
        return chain({ data: [] });
      }),
    } as never);
    await expect(viewerMaySignSocialMedia(USER, POST_KEY, NOW)).resolves.toBe(true);

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") return chain({ data: { id: OTHER, cover_key: null, welcome_video_key: null } });
        return chain({ data: [] });
      }),
    } as never);
    await expect(viewerMaySignSocialMedia(USER, POST_KEY, NOW)).resolves.toBe(false);
  });
});

function tableDataEmpty(): unknown[] {
  return [];
}
