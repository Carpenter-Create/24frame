import { afterEach, describe, expect, it, vi } from "vitest";

import { putEducationBrowserObject } from "./education-browser-put";

describe("putEducationBrowserObject", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when S3 fetch throws (CORS / network) instead of rejecting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(
      putEducationBrowserObject("https://s3.example/put", new Blob([new Uint8Array([1])]), "image/jpeg"),
    ).resolves.toBe(false);
  });

  it("returns true only when the PUT is ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
    await expect(
      putEducationBrowserObject("https://s3.example/put", new Blob([new Uint8Array([1])]), "image/jpeg"),
    ).resolves.toBe(true);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 403 })));
    await expect(
      putEducationBrowserObject("https://s3.example/put", new Blob([new Uint8Array([1])]), "image/jpeg"),
    ).resolves.toBe(false);
  });
});
