"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { isUploadAbort, runTitleAssetUpload } from "@/lib/asset-multipart-upload";

type Kind = "master" | "caption" | "poster" | "banner" | "screener" | "trailer";

// Multipart upload direct to S3 — bytes never touch the app (golden rule 14).
// initiate → per window (batch-sign → parallel PUTs) → complete.
export function AssetUpload({ titleId }: { titleId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [kind, setKind] = useState<Kind>("master");
  const [file, setFile] = useState<File | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Leaving the title drops the in-flight multipart. Without this, part PUTs
  // keep running and complete can still fire after the control is gone.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file.");
      return;
    }
    setError("");
    setPct(0);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await runTitleAssetUpload({
        titleId,
        kind,
        file,
        signal: controller.signal,
        onProgress: setPct,
      });

      setFile(null);
      // Reset the native file input too — clearing React state alone leaves the browser
      // still showing the just-uploaded filename next to "Choose File".
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPct(null);
      router.refresh();
    } catch (err) {
      setPct(null);
      // Abort is a stop. The control is usually already unmounted. Stay quiet.
      if (isUploadAbort(err) || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  return (
    <form onSubmit={onUpload} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <select
          aria-label="Asset kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
          className="rounded-[var(--radius-sm)] border border-hairline bg-surface px-2 py-1 t-body-sm text-ink"
        >
          <option value="master">Master</option>
          <option value="trailer">Trailer</option>
          <option value="caption">Caption</option>
          <optgroup label="Artwork">
            <option value="poster">Poster (vertical, ~2:3)</option>
            <option value="banner">Banner (horizontal, 16:9)</option>
          </optgroup>
          <option value="screener">Screener</option>
        </select>
        <input
          ref={fileInputRef}
          type="file"
          aria-label="Asset file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="t-body-sm text-ink-2"
        />
        <Button type="submit" disabled={pct !== null || !file} className="shrink-0">
          {pct !== null ? `Uploading ${pct}%` : "Upload"}
        </Button>
      </div>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
    </form>
  );
}
