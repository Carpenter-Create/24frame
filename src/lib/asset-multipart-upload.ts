import { planParts, planWindows } from "@/lib/upload-plan";

// How many parts are in flight at once. Multipart upload exists to be parallel —
// uploading serially wastes almost all of the available bandwidth on a big master.
const CONCURRENCY = 5;

// How many parts we ask the server to sign per round-trip. The sign-parts route
// already accepts an array (up to 1000); batching turns one round-trip per part into
// one per batch. Kept well under the 15-minute presign TTL: we sign a window, upload
// it, then sign the next — so a multi-hour upload never uses a stale URL.
const SIGN_BATCH = 25;

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type TitleAssetUploadInput = {
  titleId: string;
  kind: string;
  file: File;
  signal: AbortSignal;
  fetchImpl?: FetchLike;
  onProgress?: (pct: number) => void;
};

export function isUploadAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function abortReason(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) return signal.reason;
  return new DOMException("The operation was aborted.", "AbortError");
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortReason(signal));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(abortReason(signal));
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

// Plain presigned part PUT (SignedHeaders=host) — no checksum header; S3 returns
// the part ETag, collected for CompleteMultipartUpload. Retries back off: an
// immediate retry into a flaky connection usually just fails again. An abort is
// not a flake — it stops the part and does not start another attempt.
async function putWithRetry(
  url: string,
  body: Blob,
  signal: AbortSignal,
  fetchImpl: FetchLike,
  tries = 4,
): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    signal.throwIfAborted();
    try {
      const res = await fetchImpl(url, { method: "PUT", body, signal });
      signal.throwIfAborted();
      if (!res.ok) throw new Error(`part upload failed (${res.status})`);
      const etag = res.headers.get("ETag");
      if (!etag) throw new Error("no ETag returned");
      return etag;
    } catch (error) {
      if (isUploadAbort(error) || signal.aborted) throw isUploadAbort(error) ? error : abortReason(signal);
      if (attempt >= tries) throw error;
      await sleep(500 * 2 ** (attempt - 1), signal);
    }
  }
}

// Multipart upload direct to S3 — bytes never touch the app (golden rule 14).
// initiate → per window (batch-sign → parallel PUTs) → complete.
// There is no /api/assets/abort. The signal stops this client lifecycle so a
// late complete cannot fire after the caller has left. It does not delete an
// S3 multipart that initiate already created.
export async function runTitleAssetUpload(input: TitleAssetUploadInput): Promise<void> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const { signal, file, titleId, kind } = input;

  signal.throwIfAborted();
  const init = await fetchImpl("/api/assets/initiate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal,
    body: JSON.stringify({
      titleId,
      kind,
      filename: file.name,
      contentType: file.type || undefined,
      bytes: file.size,
    }),
  });
  if (!init.ok) throw new Error((await init.json()).error ?? "initiate failed");
  const { uploadId, key, partSize } = await init.json();

  // Byte arithmetic lives in lib/upload-plan and is unit-tested — a boundary bug
  // here would not throw, it would silently assemble a corrupt master.
  const parts = planParts(file.size, partSize);
  const done: { partNumber: number; etag: string }[] = [];
  let completed = 0;

  // Sign a window of parts in ONE round-trip, upload that window with a small
  // worker pool, then move to the next window. Parts finish out of order, which
  // is fine — CompleteMultipartUpload sorts by part number server-side.
  for (const window of planWindows(parts, SIGN_BATCH)) {
    signal.throwIfAborted();
    const sign = await fetchImpl("/api/assets/sign-parts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal,
      body: JSON.stringify({
        titleId,
        key,
        uploadId,
        parts: window.map((part) => ({ partNumber: part.partNumber })),
      }),
    });
    if (!sign.ok) throw new Error((await sign.json()).error ?? "sign failed");
    const { urls } = (await sign.json()) as { urls: { partNumber: number; url: string }[] };
    const urlFor = new Map(urls.map((entry) => [entry.partNumber, entry.url]));

    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, window.length) }, async () => {
        while (next < window.length) {
          signal.throwIfAborted();
          const part = window[next++];
          const url = urlFor.get(part.partNumber);
          if (!url) throw new Error(`no signed URL for part ${part.partNumber}`);
          const etag = await putWithRetry(url, file.slice(part.start, part.end), signal, fetchImpl);
          signal.throwIfAborted();
          done.push({ partNumber: part.partNumber, etag });
          completed += 1;
          input.onProgress?.(Math.round((completed / parts.length) * 100));
        }
      }),
    );
  }

  signal.throwIfAborted();
  const complete = await fetchImpl("/api/assets/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal,
    body: JSON.stringify({
      titleId,
      kind,
      key,
      uploadId,
      parts: done,
      bytes: file.size,
      filename: file.name,
      contentType: file.type || undefined,
    }),
  });
  if (!complete.ok) throw new Error((await complete.json()).error ?? "complete failed");
}
