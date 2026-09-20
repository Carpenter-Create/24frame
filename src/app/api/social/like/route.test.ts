import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/app/(app)/social/light-actions", () => ({ toggleSocialLike: vi.fn() }));

import { toggleSocialLike } from "@/app/(app)/social/light-actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SOCIAL_OPTIMISTIC_LOCK } from "@/lib/social-optimistic";
import { getAuthUser } from "@/lib/supabase/auth";
import { POST } from "./route";

describe("POST /api/social/like", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is 401 without a session and does not write", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost/api/social/like", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: ACCOUNT_PROFILE.signedOut });
    expect(toggleSocialLike).not.toHaveBeenCalled();
  });

  it("writes through toggleSocialLike and stays off the server-action tree", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(toggleSocialLike).mockResolvedValue({});
    const form = new FormData();
    form.set("post_id", "p1");
    const res = await POST(
      new Request("http://localhost/api/social/like", { method: "POST", body: form }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(toggleSocialLike).toHaveBeenCalledTimes(1);
    expect(SOCIAL_OPTIMISTIC_LOCK.likeHref).toBe("/api/social/like");
    const src = readFileSync("src/app/api/social/like/route.ts", "utf8");
    expect(src).toContain("toggleSocialLike");
    expect(src).toContain('from "@/app/(app)/social/light-actions"');
    expect(src).not.toContain("router.refresh");
    expect(src).not.toContain("SERVICE_ROLE");
  });
});
