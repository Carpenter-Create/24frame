import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/s3-social-media", () => ({ signedSocialMediaUrl: vi.fn() }));

import { getAuthUser } from "@/lib/supabase/auth";
import { signedSocialMediaUrl } from "@/lib/s3-social-media";
import { GET } from "./route";

const UID = "11111111-1111-4111-8111-111111111111";
const KEY = `posts/${UID}/22222222-2222-4222-8222-222222222222.jpg`;

describe("GET /api/social/media", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is 401 without a session and does not sign", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await GET(new Request(`http://local/api/social/media?key=${encodeURIComponent(KEY)}`));
    expect(res.status).toBe(401);
    expect(signedSocialMediaUrl).not.toHaveBeenCalled();
  });

  it("is 400 for a forbidden key and does not sign", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: UID, email: "ada@example.com" });
    const res = await GET(new Request("http://local/api/social/media?key=avatars/secret"));
    expect(res.status).toBe(400);
    expect(signedSocialMediaUrl).not.toHaveBeenCalled();
  });

  it("is 400 for a key that is not a posts/ or stories/ object", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: UID, email: "ada@example.com" });
    const res = await GET(new Request("http://local/api/social/media?key=misc/leftover.bin"));
    expect(res.status).toBe(400);
    expect(signedSocialMediaUrl).not.toHaveBeenCalled();
  });

  it("302s a freshly signed GET for an authenticated reader", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: UID, email: "ada@example.com" });
    vi.mocked(signedSocialMediaUrl).mockResolvedValue("https://media.example/signed");
    const res = await GET(new Request(`http://local/api/social/media?key=${encodeURIComponent(KEY)}`));
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://media.example/signed");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(signedSocialMediaUrl).toHaveBeenCalledWith(KEY);
  });
});
