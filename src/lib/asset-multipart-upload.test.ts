import { describe, expect, it, vi } from "vitest";

import { runTitleAssetUpload } from "./asset-multipart-upload";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function etagResponse(etag: string, status = 200): Response {
  return new Response(null, { status, headers: { ETag: etag } });
}

type FetchCall = { url: string; init?: RequestInit };

function routeName(url: string): string {
  if (url.endsWith("/api/assets/initiate")) return "initiate";
  if (url.endsWith("/api/assets/sign-parts")) return "sign";
  if (url.endsWith("/api/assets/complete")) return "complete";
  return "put";
}

describe("runTitleAssetUpload", () => {
  it("signs, PUTs, and completes with the same abort signal on every request", async () => {
    const controller = new AbortController();
    const calls: FetchCall[] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      if (url.endsWith("/api/assets/initiate")) {
        return json({ uploadId: "up-1", key: "masters/key", partSize: 8 });
      }
      if (url.endsWith("/api/assets/sign-parts")) {
        return json({
          urls: [
            { partNumber: 1, url: "https://s3.example/part-1" },
            { partNumber: 2, url: "https://s3.example/part-2" },
          ],
        });
      }
      if (url === "https://s3.example/part-1") return etagResponse('"e1"');
      if (url === "https://s3.example/part-2") return etagResponse('"e2"');
      if (url.endsWith("/api/assets/complete")) return json({ assetId: "asset-1" });
      throw new Error(`unexpected ${url}`);
    });

    const file = new File([new Uint8Array(16)], "master.mov", { type: "video/quicktime" });
    const progress: number[] = [];
    await runTitleAssetUpload({
      titleId: "title-1",
      kind: "master",
      file,
      signal: controller.signal,
      fetchImpl,
      onProgress: (pct) => progress.push(pct),
    });

    expect(calls.map((call) => routeName(call.url))).toEqual(["initiate", "sign", "put", "put", "complete"]);
    for (const call of calls) {
      expect(call.init?.signal).toBe(controller.signal);
    }
    const put = calls.find((call) => call.url === "https://s3.example/part-1");
    expect(put?.init?.method).toBe("PUT");
    expect(put?.init?.body).toBeInstanceOf(Blob);
    expect(put?.init?.headers).toBeUndefined();
    const complete = calls.find((call) => routeName(call.url) === "complete");
    const body = JSON.parse(String(complete?.init?.body)) as {
      parts: { partNumber: number; etag: string }[];
      bytes: number;
      filename: string;
    };
    expect(body.bytes).toBe(16);
    expect(body.filename).toBe("master.mov");
    expect([...body.parts].sort((a, b) => a.partNumber - b.partNumber)).toEqual([
      { partNumber: 1, etag: '"e1"' },
      { partNumber: 2, etag: '"e2"' },
    ]);
    expect(progress).toEqual([50, 100]);
    expect(controller.signal.aborted).toBe(false);
  });

  it("does not complete after abort once a part has already succeeded", async () => {
    const controller = new AbortController();
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(routeName(url));
      expect(init?.signal).toBe(controller.signal);
      if (url.endsWith("/api/assets/initiate")) {
        return json({ uploadId: "up-1", key: "masters/key", partSize: 8 });
      }
      if (url.endsWith("/api/assets/sign-parts")) {
        return json({ urls: [{ partNumber: 1, url: "https://s3.example/part-1" }] });
      }
      if (url === "https://s3.example/part-1") return etagResponse('"e1"');
      if (url.endsWith("/api/assets/complete")) return json({ assetId: "asset-1" });
      throw new Error(`unexpected ${url}`);
    });

    const file = new File([new Uint8Array(8)], "master.mov", { type: "video/quicktime" });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(
        runTitleAssetUpload({
          titleId: "title-1",
          kind: "master",
          file,
          signal: controller.signal,
          fetchImpl,
          onProgress: () => {
            controller.abort();
          },
        }),
      ).rejects.toMatchObject({ name: "AbortError" });
    } finally {
      errorSpy.mockRestore();
    }

    expect(calls).toEqual(["initiate", "sign", "put"]);
    expect(calls).not.toContain("complete");
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("stops in-flight part PUTs on abort and does not retry or complete", async () => {
    const controller = new AbortController();
    const calls: string[] = [];
    const fetchImpl = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const signal = init?.signal;
      calls.push(routeName(url));
      if (url.endsWith("/api/assets/initiate")) {
        return Promise.resolve(json({ uploadId: "up-1", key: "masters/key", partSize: 8 }));
      }
      if (url.endsWith("/api/assets/sign-parts")) {
        return Promise.resolve(
          json({
            urls: [
              { partNumber: 1, url: "https://s3.example/part-1" },
              { partNumber: 2, url: "https://s3.example/part-2" },
            ],
          }),
        );
      }
      if (url.endsWith("/api/assets/complete")) {
        return Promise.resolve(json({ assetId: "asset-1" }));
      }
      // No signal: the PUT cannot be cancelled, so it succeeds. The upload must
      // not be able to reach complete in that case — the test aborts only the
      // controller, which does nothing unless this PUT was given that signal.
      if (!signal) return Promise.resolve(etagResponse(`"etag"`));
      if (signal.aborted) return Promise.reject(abortError(signal));
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(abortError(signal)), { once: true });
      });
    });

    const file = new File([new Uint8Array(16)], "master.mov", { type: "video/quicktime" });
    const pending = runTitleAssetUpload({
      titleId: "title-1",
      kind: "master",
      file,
      signal: controller.signal,
      fetchImpl,
    });
    await vi.waitFor(() => {
      expect(calls.filter((call) => call === "put")).toHaveLength(2);
    });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(calls.filter((call) => call === "put")).toHaveLength(2);
    expect(calls).not.toContain("complete");
  });

  it("retries a failed part PUT and still completes", async () => {
    const controller = new AbortController();
    let puts = 0;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/assets/initiate")) {
        return json({ uploadId: "up-1", key: "masters/key", partSize: 8 });
      }
      if (url.endsWith("/api/assets/sign-parts")) {
        return json({ urls: [{ partNumber: 1, url: "https://s3.example/part-1" }] });
      }
      if (url === "https://s3.example/part-1") {
        puts += 1;
        if (puts === 1) return etagResponse('"e1"', 503);
        return etagResponse('"e1"');
      }
      if (url.endsWith("/api/assets/complete")) return json({ assetId: "asset-1" });
      throw new Error(`unexpected ${url}`);
    });

    const file = new File([new Uint8Array(8)], "master.mov", { type: "video/quicktime" });
    await runTitleAssetUpload({
      titleId: "title-1",
      kind: "master",
      file,
      signal: controller.signal,
      fetchImpl,
    });
    expect(puts).toBe(2);
  });
});

function abortError(signal: AbortSignal | null | undefined): Error {
  if (signal?.reason instanceof Error) return signal.reason;
  return new DOMException("The operation was aborted.", "AbortError");
}
