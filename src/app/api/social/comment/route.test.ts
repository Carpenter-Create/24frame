import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/app/(app)/social/light-actions", () => ({
  createSocialComment: vi.fn(),
  deleteSocialComment: vi.fn(),
}));

import { createSocialComment, deleteSocialComment } from "@/app/(app)/social/light-actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SOCIAL_OPTIMISTIC_LOCK } from "@/lib/social-optimistic";
import { getAuthUser } from "@/lib/supabase/auth";
import { DELETE, POST } from "./route";

describe("POST/DELETE /api/social/comment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is 401 without a session and does not write", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost/api/social/comment", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: ACCOUNT_PROFILE.signedOut });
    expect(createSocialComment).not.toHaveBeenCalled();
  });

  it("writes through createSocialComment and stays off the server-action tree", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(createSocialComment).mockResolvedValue({
      id: "c1",
      created_at: "2026-09-21T12:00:00.000Z",
    });
    const form = new FormData();
    form.set("post_id", "p1");
    form.set("body", "hello");
    const res = await POST(
      new Request("http://localhost/api/social/comment", { method: "POST", body: form }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "c1", created_at: "2026-09-21T12:00:00.000Z" });
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(createSocialComment).toHaveBeenCalledTimes(1);
    expect(SOCIAL_OPTIMISTIC_LOCK.commentHref).toBe("/api/social/comment");
    const src = readFileSync("src/app/api/social/comment/route.ts", "utf8");
    expect(src).toContain("createSocialComment");
    expect(src).toContain("deleteSocialComment");
    expect(src).not.toContain("router.refresh");
    expect(src).not.toContain("SERVICE_ROLE");
  });

  it("soft-deletes through deleteSocialComment", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(deleteSocialComment).mockResolvedValue({});
    const form = new FormData();
    form.set("comment_id", "c1");
    const res = await DELETE(
      new Request("http://localhost/api/social/comment", { method: "DELETE", body: form }),
    );
    expect(res.status).toBe(200);
    expect(deleteSocialComment).toHaveBeenCalledTimes(1);
  });
});
