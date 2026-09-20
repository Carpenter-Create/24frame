import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createSocialMuxDirectUpload,
  finalizeSocialMuxDirectUpload,
  publicPlaybackIdFromAsset,
  socialMuxSettingsFromUploadInput,
} from "./social-mux-server";

const UPLOAD_ID = "zd01Pe2bNpYhxbrwYABgFE";
const ASSET_ID = "SqQnqz6s5MBuXGvJaUWdXu";
const PLAYBACK_ID = "uNbxnGLKJ00yfbijDO8COxT";

function muxJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("social Mux server client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("creates a direct upload with the locked encode settings", async () => {
    vi.stubEnv("MUX_TOKEN_ID", "tid");
    vi.stubEnv("MUX_TOKEN_SECRET", "tsecret");
    const fetchMock = vi.fn().mockResolvedValue(
      muxJson({
        id: UPLOAD_ID,
        url: "https://storage.googleapis.com/mux-upload",
        status: "waiting",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createSocialMuxDirectUpload({
        settings: { videoQuality: "basic", maxResolutionTier: "1080p" },
        passthrough: "user:object",
      }),
    ).resolves.toEqual({
      uploadId: UPLOAD_ID,
      url: "https://storage.googleapis.com/mux-upload",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mux.com/video/v1/uploads",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from("tid:tsecret").toString("base64")}`,
        }),
      }),
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      new_asset_settings: Record<string, unknown>;
    };
    expect(body.new_asset_settings).toMatchObject({
      playback_policies: ["public"],
      video_quality: "basic",
      max_resolution_tier: "1080p",
      passthrough: "user:object",
    });
  });

  it("finalizes an upload once Mux has a public playback id", async () => {
    vi.stubEnv("MUX_TOKEN_ID", "tid");
    vi.stubEnv("MUX_TOKEN_SECRET", "tsecret");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(muxJson({ id: UPLOAD_ID, status: "asset_created", asset_id: ASSET_ID }))
      .mockResolvedValueOnce(
        muxJson({
          id: ASSET_ID,
          status: "preparing",
          playback_ids: [{ id: PLAYBACK_ID, policy: "public" }],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(finalizeSocialMuxDirectUpload(UPLOAD_ID)).resolves.toEqual({
      uploadId: UPLOAD_ID,
      assetId: ASSET_ID,
      playbackId: PLAYBACK_ID,
    });
  });

  it("maps live + 4K form fields on the server, not the client", () => {
    expect(
      socialMuxSettingsFromUploadInput({
        intent: "live",
        originalQuality: true,
        width: 3840,
        height: 2160,
      }),
    ).toEqual({
      intent: "live",
      settings: { videoQuality: "plus", maxResolutionTier: "1080p" },
    });
    expect(
      socialMuxSettingsFromUploadInput({
        intent: "video",
        originalQuality: true,
        width: 3840,
        height: 2160,
      }).settings.maxResolutionTier,
    ).toBe("2160p");
    expect(
      publicPlaybackIdFromAsset({
        playback_ids: [
          { id: "signedxx", policy: "signed" },
          { id: PLAYBACK_ID, policy: "public" },
        ],
      }),
    ).toBe(PLAYBACK_ID);
  });
});
