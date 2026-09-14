import { describe, expect, it } from "vitest";

import {
  isForbiddenMediaBucket,
  isForbiddenMediaKey,
  isOwnedSocialMediaKey,
  mediaItemsForInsert,
  parsePostMedia,
  socialMediaObjectKey,
  validateMediaUpload,
} from "./social-media";

const USER = "11111111-1111-4111-8111-111111111111";
const OBJECT = "22222222-2222-4222-8222-222222222222";

describe("social media keys", () => {
  it("namespaces image and video keys under posts/{user}/{object}", () => {
    expect(socialMediaObjectKey(USER, OBJECT, "image/jpeg")).toBe(
      `posts/${USER}/${OBJECT}.jpg`,
    );
    expect(socialMediaObjectKey(USER, OBJECT, "video/mp4")).toBe(
      `posts/${USER}/${OBJECT}.mp4`,
    );
    expect(isOwnedSocialMediaKey(`posts/${USER}/${OBJECT}.jpg`, USER)).toBe(true);
    expect(socialMediaObjectKey(USER, OBJECT, "image/jpeg", "stories")).toBe(
      `stories/${USER}/${OBJECT}.jpg`,
    );
    expect(isOwnedSocialMediaKey(`stories/${USER}/${OBJECT}.jpg`, USER, "stories")).toBe(true);
    expect(isOwnedSocialMediaKey(`stories/${USER}/${OBJECT}.jpg`, USER)).toBe(false);
  });

  it("rejects title-bucket keys, traversal, and avatar prefixes", () => {
    expect(isForbiddenMediaKey(`orgs/${USER}/titles/${OBJECT}/master/a.mov`)).toBe(true);
    expect(isForbiddenMediaKey("titles/film.mov")).toBe(true);
    expect(isForbiddenMediaKey(`avatars/${USER}/avatar`)).toBe(true);
    expect(isForbiddenMediaKey("gc-content-assets/posts/x.jpg")).toBe(true);
    expect(isForbiddenMediaKey(`posts/${USER}/../${OBJECT}.jpg`)).toBe(true);
    expect(isForbiddenMediaKey("/posts/abs.jpg")).toBe(true);
    expect(isOwnedSocialMediaKey(`orgs/${USER}/titles/${OBJECT}/master/a.mov`, USER)).toBe(false);
    expect(isOwnedSocialMediaKey(`posts/${OBJECT}/${OBJECT}.jpg`, USER)).toBe(false);
  });

  it("refuses S3_BUCKET and gc-content-assets as media buckets", () => {
    expect(isForbiddenMediaBucket("test-bucket")).toBe(true);
    expect(isForbiddenMediaBucket("gc-content-assets")).toBe(true);
    expect(isForbiddenMediaBucket("test-avatars-bucket")).toBe(true);
    expect(isForbiddenMediaBucket("24frame-media-source-prod")).toBe(false);
    expect(isForbiddenMediaBucket("test-media-source-bucket")).toBe(false);
  });
});

describe("posts.media persist shape", () => {
  it("keeps owned image and video keys and drops junk", () => {
    const key = `posts/${USER}/${OBJECT}.jpg`;
    const video = `posts/${USER}/${OBJECT}.mp4`;
    expect(
      parsePostMedia([
        { kind: "image", key, contentType: "image/jpeg" },
        { kind: "video", key: video, contentType: "video/mp4" },
        { kind: "image", key: `orgs/${USER}/titles/x`, contentType: "image/jpeg" },
      ]),
    ).toEqual([
      { kind: "image", key, contentType: "image/jpeg" },
      { kind: "video", key: video, contentType: "video/mp4" },
    ]);
  });

  it("rejects title keys on insert even when the rest is valid", () => {
    const owned = {
      kind: "image" as const,
      key: `posts/${USER}/${OBJECT}.jpg`,
      contentType: "image/jpeg" as const,
    };
    expect(mediaItemsForInsert([owned], USER)).toEqual({ ok: true, items: [owned] });
    expect(
      mediaItemsForInsert(
        [
          owned,
          {
            kind: "video",
            key: `orgs/${USER}/titles/${OBJECT}/master/clip.mp4`,
            contentType: "video/mp4",
          },
        ],
        USER,
      ),
    ).toEqual({ ok: false, error: "forbidden" });
  });

  it("bounds type and size", () => {
    expect(validateMediaUpload({ contentType: "image/jpeg", byteLength: 12 })).toMatchObject({
      ok: true,
      kind: "image",
    });
    expect(validateMediaUpload({ contentType: "video/mp4", byteLength: 12 })).toMatchObject({
      ok: true,
      kind: "video",
    });
    expect(validateMediaUpload({ contentType: "application/pdf", byteLength: 12 })).toEqual({
      ok: false,
      error: "type",
    });
    expect(validateMediaUpload({ contentType: "image/jpeg", byteLength: 11 * 1024 * 1024 })).toEqual({
      ok: false,
      error: "tooLarge",
    });
  });
});
