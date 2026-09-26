import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import {
  postAuthorRefusal,
  postCaptionUpdateRow,
  postCaptionWrite,
  postHasMedia,
  postSoftDeleteUpdateRow,
  socialPostOwnedBy,
} from "@/lib/social-post-own";

describe("own-post caption and soft-delete", () => {
  it("edits caption text and allows an empty caption only when media remains", () => {
    expect(postCaptionWrite("  hello  ", false)).toEqual({ body: "hello" });
    expect(postCaptionWrite("   ", false)).toEqual({ error: SOCIAL.home.emptyPost });
    expect(postCaptionWrite("   ", true)).toEqual({ body: null });
    expect(postCaptionWrite("x".repeat(2001), true)).toEqual({ error: SOCIAL.post.editTooLong });
    expect(postHasMedia([])).toBe(false);
    expect(postHasMedia([{ kind: "image" }])).toBe(true);
  });

  it("refuses a non-author and does not put media on the write", () => {
    expect(postAuthorRefusal("u1", "u1")).toBeNull();
    expect(postAuthorRefusal("u1", "u2")).toBe(SOCIAL.post.notAuthor);
    expect(socialPostOwnedBy("u1", "u1")).toBe(true);
    expect(socialPostOwnedBy("u1", "u2")).toBe(false);
    expect(socialPostOwnedBy("u1", null)).toBe(false);
    expect(socialPostOwnedBy("u1", undefined)).toBe(false);
    expect(socialPostOwnedBy("u1", "")).toBe(false);
    expect(socialPostOwnedBy("", "")).toBe(false);
    expect(postCaptionUpdateRow("hello")).toEqual({ body: "hello" });
    expect(postCaptionUpdateRow("hello")).not.toHaveProperty("edited_at");
    expect(postSoftDeleteUpdateRow()).toEqual({ status: "removed" });
    expect(postCaptionUpdateRow("hello")).not.toHaveProperty("media");
    expect(postSoftDeleteUpdateRow()).not.toHaveProperty("body");
    expect(postCaptionWrite.length).toBe(2);
  });
});
