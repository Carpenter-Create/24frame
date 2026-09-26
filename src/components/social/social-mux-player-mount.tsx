"use client";

import { useEffect, useRef } from "react";

import {
  mountQuietMuxPlayer,
  type QuietMuxHost,
  type QuietMuxPlayerElement,
  type QuietMuxPlayerProps,
} from "@/lib/social-mux-player-quiet";

// Browser-only. The React mux-player wrapper writes stream, poster, muted,
// preload, and style before the node is appended, which is the Media Chrome
// warning. This host appends a bare mux-player, then assigns those fields.
// Class and playsinline stay on the quiet mount. Callers cannot override them.

export default function SocialMuxPlayerMount(props: QuietMuxPlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);
  const styleKey = Object.entries(props.style)
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  const tokenKey = props.tokens
    ? `${props.tokens.playback}|${props.tokens.thumbnail}|${props.tokens.storyboard}`
    : "";

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let player: QuietMuxPlayerElement | null = null;
    const onLoaded = () => propsRef.current.onLoadedData?.();

    void import("@mux/mux-player-react").then(() => {
      if (cancelled || !host.isConnected) return;
      const current = propsRef.current;
      player = mountQuietMuxPlayer(
        host as unknown as QuietMuxHost,
        () => document.createElement("mux-player") as unknown as QuietMuxPlayerElement,
        {
          playbackId: current.playbackId,
          streamType: current.streamType,
          preload: current.preload,
          poster: current.poster,
          autoPlay: current.autoPlay,
          muted: current.muted,
          tokens: current.tokens,
          style: current.style,
          onLoadedData: onLoaded,
        },
      );
    });

    return () => {
      cancelled = true;
      player?.removeEventListener("loadeddata", onLoaded);
      player?.remove();
    };
  }, [
    props.autoPlay,
    props.muted,
    props.playbackId,
    props.poster,
    props.preload,
    props.streamType,
    styleKey,
    tokenKey,
  ]);

  return <div ref={hostRef} className="size-full" />;
}
