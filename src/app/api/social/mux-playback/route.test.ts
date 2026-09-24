import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/social-mux-server", () => ({ mintSocialMuxPlaybackTokens: vi.fn() }));

import { mintSocialMuxPlaybackTokens } from "@/lib/social-mux-server";
import { getAuthUser } from "@/lib/supabase/auth";
import { GET } from "./route";

const PLAYBACK_ID = "uNbxnGLKJ00yfbijDO8COxT";

describe("GET /api/social/mux-playback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is 401 without a session and does not mint", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await GET(new Request(`http://local/api/social/mux-playback?playbackId=${PLAYBACK_ID}`));
    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mintSocialMuxPlaybackTokens).not.toHaveBeenCalled();
  });

  it("is 400 for a playback id the signer would not accept", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    const res = await GET(new Request("http://local/api/social/mux-playback?playbackId=short"));
    expect(res.status).toBe(400);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mintSocialMuxPlaybackTokens).not.toHaveBeenCalled();
  });

  it("returns player tokens for a signed-in reader", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
    vi.mocked(mintSocialMuxPlaybackTokens).mockResolvedValue({
      playback: "play.jwt",
      thumbnail: "thumb.jwt",
      storyboard: "board.jwt",
    });
    const res = await GET(new Request(`http://local/api/social/mux-playback?playbackId=${PLAYBACK_ID}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await res.json()).toEqual({
      playback: "play.jwt",
      thumbnail: "thumb.jwt",
      storyboard: "board.jwt",
    });
    expect(mintSocialMuxPlaybackTokens).toHaveBeenCalledWith(PLAYBACK_ID);
  });
});
