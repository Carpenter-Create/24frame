import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/app/(app)/social/light-actions", () => ({
  updateSocialPostCaption: vi.fn(),
  deleteSocialPost: vi.fn(),
}));

import { deleteSocialPost, updateSocialPostCaption } from "@/app/(app)/social/light-actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_OPTIMISTIC_LOCK } from "@/lib/social-optimistic";
import { getAuthUser } from "@/lib/supabase/auth";
import { DELETE, PATCH } from "./route";

describe("PATCH/DELETE /api/social/post-own", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is 401 without a session and does not write", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await PATCH(new Request("http://localhost/api/social/post-own", { method: "PATCH" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: ACCOUNT_PROFILE.signedOut });
    expect(updateSocialPostCaption).not.toHaveBeenCalled();
    expect(deleteSocialPost).not.toHaveBeenCalled();
  });

  it("edits through updateSocialPostCaption and stays off service role", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(updateSocialPostCaption).mockResolvedValue({});
    const form = new FormData();
    form.set("post_id", "p1");
    form.set("body", "hello");
    const res = await PATCH(
      new Request("http://localhost/api/social/post-own", { method: "PATCH", body: form }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(updateSocialPostCaption).toHaveBeenCalledTimes(1);
    expect(SOCIAL_OPTIMISTIC_LOCK.postOwnHref).toBe("/api/social/post-own");
    const src = readFileSync("src/app/api/social/post-own/route.ts", "utf8");
    expect(src).toContain("updateSocialPostCaption");
    expect(src).toContain("deleteSocialPost");
    expect(src).not.toContain("SERVICE_ROLE");
    expect(src).not.toContain("writeSocialPost");
  });

  it("returns the author refusal from the server action", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(deleteSocialPost).mockResolvedValue({ error: SOCIAL.post.notAuthor });
    const form = new FormData();
    form.set("post_id", "p1");
    const res = await DELETE(
      new Request("http://localhost/api/social/post-own", { method: "DELETE", body: form }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: SOCIAL.post.notAuthor });
    expect(deleteSocialPost).toHaveBeenCalledTimes(1);
  });
});
