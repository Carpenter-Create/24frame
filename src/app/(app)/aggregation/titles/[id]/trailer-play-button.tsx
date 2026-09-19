"use client";

import { useState } from "react";
import { CircleNotch, Play } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_ACTIVE_WEIGHT, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { Dialog } from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import { TITLE_DETAIL } from "@/lib/titles";

// Play the client-supplied trailer in a modal. Signs via /api/assets/url —
// trailer is on the client-viewable allow-list. Render this only when a trailer
// asset exists; do not invent a Play control.
export function TrailerPlayButton({ assetId }: { assetId: string }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "restoring" | "error">("idle");

  async function play() {
    setOpen(true);
    setSrc(null);
    setState("loading");
    try {
      const r = await fetch("/api/assets/url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      if (r.status === 202) return setState("restoring");
      if (!r.ok) return setState("error");
      const { url } = (await r.json()) as { url: string };
      setSrc(url);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={play}
        className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2 t-body-sm font-medium text-accent-contrast transition hover:opacity-90"
        data-title-play-trailer=""
      >
        <Play className="h-4 w-4" weight={PHOSPHOR_CHROME_ACTIVE_WEIGHT} />
        {TITLE_DETAIL.playTrailer}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={TITLE_DETAIL.playTrailer} size="xl">
        {state === "loading" ? (
          <div className="flex items-center gap-2 py-6 text-ink-3">
            <CircleNotch className="h-4 w-4 animate-spin" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
            <span className="t-body-sm">Preparing the trailer…</span>
          </div>
        ) : null}
        {state === "restoring" ? (
          <InlineNotice tone="info">
            This file is in cold storage — retrieval takes about 3 to 5 hours. Try again once it is
            ready.
          </InlineNotice>
        ) : null}
        {state === "error" ? (
          <InlineNotice tone="error">Could not load the trailer. Please try again.</InlineNotice>
        ) : null}
        {src ? (
          <video
            key={src}
            src={src}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            autoPlay
            className="w-full rounded-[var(--radius-sm)] bg-ink"
          />
        ) : null}
      </Dialog>
    </>
  );
}
