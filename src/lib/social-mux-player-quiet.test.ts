import { describe, expect, it } from "vitest";

import {
  assignConnectedMuxPlayer,
  mountQuietMuxPlayer,
  type QuietMuxPlayerElement,
  type QuietMuxPlayerProps,
  type QuietMuxPlayerStyle,
} from "./social-mux-player-quiet";

const HOUSE_STYLE: QuietMuxPlayerStyle = {
  aspectRatio: "auto",
  width: "100%",
  height: "100%",
  objectFit: "cover",
  "--controls": "none",
};

const PROPS: QuietMuxPlayerProps = {
  playbackId: "abc12345xx",
  streamType: "on-demand",
  preload: "metadata",
  poster: "https://image.mux.com/abc12345xx/thumbnail.webp",
  autoPlay: false,
  muted: true,
  tokens: { playback: "play.jwt", thumbnail: "thumb.jwt", storyboard: "board.jwt" },
  style: HOUSE_STYLE,
};

function fakePlayer(): QuietMuxPlayerElement & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    isConnected: false,
    className: "",
    playbackId: "",
    streamType: "",
    preload: "",
    poster: "",
    muted: false,
    autoplay: false,
    tokens: undefined,
    style: {
      setProperty(name: string, value: string) {
        calls.push(`style:${name}=${value}`);
      },
    },
    setAttribute(name: string, value: string) {
      calls.push(`attr:${name}=${value}`);
    },
    addEventListener(type: "loadeddata") {
      calls.push(`listen:${type}`);
    },
    removeEventListener() {},
    remove() {},
  };
}

describe("mountQuietMuxPlayer", () => {
  it("appends the element before playback, stream, poster, or style", () => {
    const player = fakePlayer();
    const host = {
      appendChild(node: QuietMuxPlayerElement) {
        player.calls.push("append");
        node.isConnected = true;
      },
    };
    mountQuietMuxPlayer(host, () => player, { ...PROPS, onLoadedData: () => {} });
    const appendAt = player.calls.indexOf("append");
    expect(appendAt).toBeGreaterThanOrEqual(0);
    expect(player.calls.slice(0, appendAt)).toEqual(["attr:playsinline="]);
    expect(player.playbackId).toBe("abc12345xx");
    expect(player.streamType).toBe("on-demand");
    expect(player.preload).toBe("metadata");
    expect(player.poster).toBe(PROPS.poster);
    expect(player.muted).toBe(true);
    expect(player.autoplay).toBe(false);
    expect(player.tokens).toEqual(PROPS.tokens);
    expect(player.calls.slice(appendAt + 1)).toEqual([
      "style:aspect-ratio=auto",
      "style:width=100%",
      "style:height=100%",
      "style:object-fit=cover",
      "style:--controls=none",
      "listen:loadeddata",
    ]);
    expect(player.className).toBe("size-full object-cover");
    expect(player.isConnected).toBe(true);
  });

  it("refuses to assign fields while the element is disconnected", () => {
    const player = fakePlayer();
    expect(() => assignConnectedMuxPlayer(player, PROPS)).toThrow(/connected/);
    expect(player.playbackId).toBe("");
    expect(player.calls).toEqual([]);
  });

  it("writes only the house style tokens", () => {
    const player = fakePlayer();
    player.isConnected = true;
    const open: QuietMuxPlayerStyle = {
      aspectRatio: "auto",
      width: "100%",
      height: "100%",
      objectFit: "cover",
    };
    assignConnectedMuxPlayer(player, { ...PROPS, style: open });
    expect(player.calls.filter((call) => call.startsWith("style:"))).toEqual([
      "style:aspect-ratio=auto",
      "style:width=100%",
      "style:height=100%",
      "style:object-fit=cover",
    ]);

    const injected = fakePlayer();
    injected.isConnected = true;
    assignConnectedMuxPlayer(injected, {
      ...PROPS,
      style: {
        ...HOUSE_STYLE,
        backgroundImage: "url(https://example.invalid/x)",
        width: "1px",
      } as unknown as QuietMuxPlayerStyle,
    });
    expect(injected.calls.filter((call) => call.startsWith("style:"))).toEqual([
      "style:aspect-ratio=auto",
      "style:height=100%",
      "style:object-fit=cover",
      "style:--controls=none",
    ]);
  });
});
