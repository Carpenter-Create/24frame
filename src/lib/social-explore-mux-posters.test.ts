import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/social-mux-server", () => ({
  mintSocialMuxPlaybackTokens: vi.fn(async () => ({
    playback: "play.jwt",
    thumbnail: "thumb.jwt",
    storyboard: "board.jwt",
  })),
}));

import { mintSocialMuxPlaybackTokens } from "@/lib/social-mux-server";
import { SOCIAL_MUX_PROVIDER, socialMuxThumbnailUrl } from "@/lib/social-mux";
import { exploreMuxPosterSrc, signExploreMuxPosterUrls } from "./social-explore-mux-posters";

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "33333333-3333-4333-8333-333333333333";
const OBJECT = "22222222-2222-4222-8222-222222222222";
const PLAYBACK = "uNbxnGLKJ00yfbijDO8COxT";
const PLAYBACK_B = "vNbxnGLKJ00yfbijDO8COxU";

function signedMedia(authorId: string, playbackId: string) {
  return [
    {
      kind: "video" as const,
      key: `posts/${authorId}/${OBJECT}.mp4`,
      contentType: "video/mp4" as const,
      provider: SOCIAL_MUX_PROVIDER,
      playbackId,
      playbackPolicy: "signed" as const,
    },
  ];
}

describe("signExploreMuxPosterUrls", () => {
  beforeEach(() => {
    vi.mocked(mintSocialMuxPlaybackTokens).mockClear();
    vi.mocked(mintSocialMuxPlaybackTokens).mockResolvedValue({
      playback: "play.jwt",
      thumbnail: "thumb.jwt",
      storyboard: "board.jwt",
    });
  });

  it("does not mint a public poster", async () => {
    const urls = await signExploreMuxPosterUrls({
      userId: USER,
      posts: [
        {
          authorId: OTHER,
          media: [
            {
              kind: "video",
              key: `posts/${OTHER}/${OBJECT}.mp4`,
              contentType: "video/mp4",
              provider: SOCIAL_MUX_PROVIDER,
              playbackId: PLAYBACK,
              playbackPolicy: "public",
            },
          ],
        },
      ],
    });
    expect(urls.size).toBe(0);
    expect(mintSocialMuxPlaybackTokens).not.toHaveBeenCalled();
  });

  it("mints one token for a duplicated signed cover", async () => {
    const media = signedMedia(OTHER, PLAYBACK);
    const urls = await signExploreMuxPosterUrls({
      userId: USER,
      posts: [
        { authorId: OTHER, media },
        { authorId: OTHER, media },
      ],
    });
    expect(mintSocialMuxPlaybackTokens).toHaveBeenCalledTimes(1);
    expect(mintSocialMuxPlaybackTokens).toHaveBeenCalledWith(PLAYBACK);
    expect(urls.get(PLAYBACK)).toBe(socialMuxThumbnailUrl(PLAYBACK, "thumb.jwt"));
  });

  it("mints each distinct signed cover", async () => {
    const urls = await signExploreMuxPosterUrls({
      userId: USER,
      posts: [
        { authorId: OTHER, media: signedMedia(OTHER, PLAYBACK) },
        { authorId: OTHER, media: signedMedia(OTHER, PLAYBACK_B) },
      ],
    });
    expect(mintSocialMuxPlaybackTokens).toHaveBeenCalledTimes(2);
    expect(urls.get(PLAYBACK_B)).toBe(socialMuxThumbnailUrl(PLAYBACK_B, "thumb.jwt"));
  });

  it("does not mint when the cover key is not the author's", async () => {
    const urls = await signExploreMuxPosterUrls({
      userId: USER,
      posts: [{ authorId: OTHER, media: signedMedia(USER, PLAYBACK) }],
    });
    expect(urls.size).toBe(0);
    expect(mintSocialMuxPlaybackTokens).not.toHaveBeenCalled();
  });

  it("does not mint when the read grant denies the viewer", async () => {
    const urls = await signExploreMuxPosterUrls({
      userId: "",
      posts: [{ authorId: OTHER, media: signedMedia(OTHER, PLAYBACK) }],
    });
    expect(urls.size).toBe(0);
    expect(mintSocialMuxPlaybackTokens).not.toHaveBeenCalled();
  });

  it("omits a cover whose mint throws and still signs the rest", async () => {
    vi.mocked(mintSocialMuxPlaybackTokens).mockImplementation(async (playbackId: string) => {
      if (playbackId === PLAYBACK) throw new Error("no signing key");
      return { playback: "play.jwt", thumbnail: "thumb.jwt", storyboard: "board.jwt" };
    });
    const urls = await signExploreMuxPosterUrls({
      userId: USER,
      posts: [
        { authorId: OTHER, media: signedMedia(OTHER, PLAYBACK) },
        { authorId: OTHER, media: signedMedia(OTHER, PLAYBACK_B) },
      ],
    });
    expect(urls.has(PLAYBACK)).toBe(false);
    expect(urls.get(PLAYBACK_B)).toBe(socialMuxThumbnailUrl(PLAYBACK_B, "thumb.jwt"));
  });
});

describe("exploreMuxPosterSrc", () => {
  it("uses the unsigned proxy for public playback and a closed face when the token is missing", () => {
    const posters = new Map<string, string>();
    expect(
      exploreMuxPosterSrc(
        { url: socialMuxThumbnailUrl(PLAYBACK), playbackId: PLAYBACK, playbackPolicy: "public" },
        posters,
      ),
    ).toBe(socialMuxThumbnailUrl(PLAYBACK));
    expect(
      exploreMuxPosterSrc({ url: "", playbackId: PLAYBACK, playbackPolicy: "signed" }, posters),
    ).toBe("");
    posters.set(PLAYBACK, socialMuxThumbnailUrl(PLAYBACK, "thumb.jwt"));
    expect(
      exploreMuxPosterSrc({ url: "", playbackId: PLAYBACK, playbackPolicy: "signed" }, posters),
    ).toBe(socialMuxThumbnailUrl(PLAYBACK, "thumb.jwt"));
    expect(exploreMuxPosterSrc({ url: "", playbackPolicy: "signed" }, posters)).toBe("");
  });
});
