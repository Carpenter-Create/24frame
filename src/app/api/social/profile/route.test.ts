import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/app/(app)/social/actions", () => ({ createSocialProfile: vi.fn() }));

import { createSocialProfile } from "@/app/(app)/social/actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_PROFILE_EDIT_LOCK } from "@/lib/social-profile-edit";
import { getAuthUser } from "@/lib/supabase/auth";
import { POST } from "./route";

describe("POST /api/social/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is 401 without a session and does not write", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost/api/social/profile", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: ACCOUNT_PROFILE.signedOut });
    expect(createSocialProfile).not.toHaveBeenCalled();
  });

  it("writes through createSocialProfile and returns the persist error", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(createSocialProfile).mockResolvedValue({ error: SOCIAL.profile.handleTaken });
    const form = new FormData();
    form.set("handle", "@ada");
    const res = await POST(
      new Request("http://localhost/api/social/profile", { method: "POST", body: form }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: SOCIAL.profile.handleTaken });
    expect(createSocialProfile).toHaveBeenCalledTimes(1);
  });

  it("returns an empty body on persist and stays off the server-action tree", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(createSocialProfile).mockResolvedValue({});
    const res = await POST(
      new Request("http://localhost/api/social/profile", { method: "POST", body: new FormData() }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(SOCIAL_PROFILE_EDIT_LOCK.saveHref).toBe("/api/social/profile");
    const src = readFileSync("src/app/api/social/profile/route.ts", "utf8");
    expect(src).toContain("createSocialProfile");
    expect(src).not.toContain("router.refresh");
    const edit = readFileSync("src/components/social/social-profile-edit.tsx", "utf8");
    expect(edit).toContain("persistSocialProfileEdit");
    expect(edit).not.toContain("createSocialProfile");
  });
});
