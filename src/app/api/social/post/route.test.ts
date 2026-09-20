import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/app/(app)/social/actions", () => ({ writeSocialPost: vi.fn() }));

import { writeSocialPost } from "@/app/(app)/social/actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_OPTIMISTIC_LOCK } from "@/lib/social-optimistic";
import { getAuthUser } from "@/lib/supabase/auth";
import { POST } from "./route";

describe("POST /api/social/post", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is 401 without a session and does not write", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost/api/social/post", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: ACCOUNT_PROFILE.signedOut });
    expect(writeSocialPost).not.toHaveBeenCalled();
  });

  it("writes through writeSocialPost and returns the persist error", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(writeSocialPost).mockResolvedValue({ error: SOCIAL.home.emptyPost });
    const form = new FormData();
    form.set("body", "");
    const res = await POST(
      new Request("http://localhost/api/social/post", { method: "POST", body: form }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: SOCIAL.home.emptyPost });
    expect(writeSocialPost).toHaveBeenCalledTimes(1);
    expect(SOCIAL_OPTIMISTIC_LOCK.postHref).toBe("/api/social/post");
    const src = readFileSync("src/app/api/social/post/route.ts", "utf8");
    expect(src).toContain("writeSocialPost");
    expect(src).not.toContain("createSocialPost");
    expect(src).not.toContain("redirect(");
    expect(src).not.toContain("SERVICE_ROLE");
  });
});
