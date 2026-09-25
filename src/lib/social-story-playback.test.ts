import { beforeEach, describe, expect, it, vi } from "vitest";

const signedSocialMediaUrl = vi.hoisted(() => vi.fn());

vi.mock("@/lib/s3-social-media", () => ({
  signedSocialMediaUrl,
}));

import { SOCIAL_MEDIA_ROUTE } from "@/lib/social-edge";
import { signedStoryPlaybackItems } from "@/lib/social-story-playback";

const USER = "11111111-1111-4111-8111-111111111111";
const OBJECT = "22222222-2222-4222-8222-222222222222";

describe("signedStoryPlaybackItems", () => {
  beforeEach(() => {
    signedSocialMediaUrl.mockReset();
    signedSocialMediaUrl.mockImplementation(async (key: string) => `https://media.example/${key}`);
  });

  it("fails closed on native story video and does not sign the object", async () => {
    const imageKey = `stories/${USER}/${OBJECT}.jpg`;
    const videoKey = `stories/${USER}/${OBJECT}.mp4`;
    const items = await signedStoryPlaybackItems(
      [
        { kind: "image", key: imageKey, contentType: "image/jpeg" },
        { kind: "video", key: videoKey, contentType: "video/mp4" },
      ],
      USER,
    );
    expect(items[0]).toMatchObject({
      kind: "image",
      url: `${SOCIAL_MEDIA_ROUTE}?key=${encodeURIComponent(imageKey)}`,
    });
    expect(items[1]?.url).toBe("");
    expect(items[1]?.url).not.toContain(SOCIAL_MEDIA_ROUTE);
    expect(items[1]?.playbackId).toBeUndefined();
    expect(signedSocialMediaUrl).not.toHaveBeenCalled();
  });

  it("keeps Mux playback id and policy for the existing player and does not sign the object", async () => {
    const key = `stories/${USER}/${OBJECT}.mp4`;
    const items = await signedStoryPlaybackItems(
      [
        {
          kind: "video",
          key,
          contentType: "video/mp4",
          provider: "mux",
          playbackId: "uNbxnGLKJ00yfbijDO8COxT",
          playbackPolicy: "signed",
        },
      ],
      USER,
    );
    expect(items[0]).toMatchObject({
      kind: "video",
      playbackId: "uNbxnGLKJ00yfbijDO8COxT",
      playbackPolicy: "signed",
    });
    expect(items[0]?.url).not.toContain("token=");
    expect(signedSocialMediaUrl).not.toHaveBeenCalled();
  });
});
