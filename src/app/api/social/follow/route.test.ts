import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/app/(app)/social/light-actions", () => ({ toggleSocialFollow: vi.fn() }));

import { toggleSocialFollow } from "@/app/(app)/social/light-actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SOCIAL_OPTIMISTIC_LOCK } from "@/lib/social-optimistic";
import { getAuthUser } from "@/lib/supabase/auth";
import { POST } from "./route";

describe("POST /api/social/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is 401 without a session and does not write", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost/api/social/follow", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: ACCOUNT_PROFILE.signedOut });
    expect(toggleSocialFollow).not.toHaveBeenCalled();
  });

  it("writes through toggleSocialFollow and stays off the server-action tree", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(toggleSocialFollow).mockResolvedValue({});
    const form = new FormData();
    form.set("followee_id", "u2");
    const res = await POST(
      new Request("http://localhost/api/social/follow", { method: "POST", body: form }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(toggleSocialFollow).toHaveBeenCalledTimes(1);
    expect(SOCIAL_OPTIMISTIC_LOCK.followHref).toBe("/api/social/follow");
    const src = readFileSync("src/app/api/social/follow/route.ts", "utf8");
    expect(src).toContain("toggleSocialFollow");
    expect(src).toContain('from "@/app/(app)/social/light-actions"');
    expect(src).not.toContain("router.refresh");
    expect(src).not.toContain("revalidatePath");
    expect(src).not.toContain("SERVICE_ROLE");
  });
});
