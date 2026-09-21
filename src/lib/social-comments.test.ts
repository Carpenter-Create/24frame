import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import {
  COMMENT_BODY_MAX,
  commentBodyError,
  commentInsertRow,
  normalizeCommentBody,
  socialCommentSnippet,
} from "@/lib/social-comments";

describe("comment parse", () => {
  it("trims and accepts a non-empty body", () => {
    expect(normalizeCommentBody("  hello  ")).toBe("hello");
    expect(commentInsertRow({ postId: "p1", authorId: "u1", body: "hello" })).toEqual({
      post_id: "p1",
      author_id: "u1",
      body: "hello",
    });
  });

  it("rejects empty and over-long bodies", () => {
    expect(normalizeCommentBody("   ")).toBeNull();
    expect(normalizeCommentBody("a".repeat(COMMENT_BODY_MAX + 1))).toBeNull();
    expect(commentBodyError("")).toBe(SOCIAL.post.commentMissing);
    expect(commentBodyError("a".repeat(COMMENT_BODY_MAX + 1))).toBe(SOCIAL.post.commentTooLong);
  });

  it("cuts the UI snippet on a word boundary and keeps the full body elsewhere", () => {
    const long = `${"word ".repeat(50)}end`;
    const snippet = socialCommentSnippet(long, 40);
    expect(snippet.endsWith("…")).toBe(true);
    expect(snippet.includes("word")).toBe(true);
    expect(snippet.length).toBeLessThan(long.length);
    expect(socialCommentSnippet("short note")).toBe("short note");
  });
});
