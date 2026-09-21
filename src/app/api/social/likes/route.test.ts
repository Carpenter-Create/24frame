import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/social-feed", () => ({
  loadVisiblePost: vi.fn(),
  loadPostLikers: vi.fn(),
  loadProfilesByIds: vi.fn(),
}));

import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SOCIAL } from "@/lib/social";
import { loadPostLikers, loadProfilesByIds, loadVisiblePost } from "@/lib/social-feed";
import { getAuthUser } from "@/lib/supabase/auth";
import { GET } from "./route";

describe("GET /api/social/likes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is 401 without a session", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/social/likes?post_id=p1"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: ACCOUNT_PROFILE.signedOut });
    expect(loadVisiblePost).not.toHaveBeenCalled();
  });

  it("lists likers for a visible post", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(loadVisiblePost).mockResolvedValue({
      id: "p1",
      body: "hello",
      author_id: "u2",
      group_id: null,
      like_count: 1,
      comment_count: 0,
      created_at: "2026-09-21T12:00:00.000Z",
      media: [],
    });
    vi.mocked(loadPostLikers).mockResolvedValue({ userIds: ["u3"], truncated: false });
    vi.mocked(loadProfilesByIds).mockResolvedValue(
      new Map([["u3", { id: "u3", handle: "maya", display_name: "Maya", status: "active" }]]),
    );
    const res = await GET(new Request("http://localhost/api/social/likes?post_id=p1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      people: [
        {
          id: "u3",
          handle: "maya",
          displayName: "Maya",
          photoUrl: "/api/social/avatar/u3",
        },
      ],
      truncated: false,
    });
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const src = readFileSync("src/app/api/social/likes/route.ts", "utf8");
    expect(src).toContain("loadPostLikers");
    expect(src).toContain("loadVisiblePost");
    expect(src).not.toContain("SERVICE_ROLE");
    expect(src).not.toContain("createAdminClient");
  });

  it("is 404 when the post is not visible", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(loadVisiblePost).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/social/likes?post_id=missing"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: SOCIAL.post.missing });
    expect(loadPostLikers).not.toHaveBeenCalled();
  });
});
