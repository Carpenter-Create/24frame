import "@/test/minimal-document";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@mux/mux-player-react", () => ({}));

import SocialMuxPlayerMount from "./social-mux-player-mount";
import type { QuietMuxPlayerProps, QuietMuxPlayerStyle } from "@/lib/social-mux-player-quiet";
import { minimalDocument, uninstallMinimalDocument } from "@/test/minimal-document";

const STYLE: QuietMuxPlayerStyle = {
  aspectRatio: "auto",
  width: "100%",
  height: "100%",
  objectFit: "cover",
  "--controls": "none",
};

const BASE: QuietMuxPlayerProps = {
  playbackId: "abc12345xx",
  streamType: "on-demand",
  preload: "metadata",
  poster: "https://image.mux.com/abc12345xx/thumbnail.webp",
  autoPlay: true,
  muted: false,
  tokens: { playback: "play.jwt", thumbnail: "thumb.jwt", storyboard: "board.jwt" },
  style: STYLE,
  onLoadedData: () => {},
};

type MuxNode = {
  tagName?: string;
  childNodes?: MuxNode[];
  muted: boolean;
  autoplay: boolean;
  playbackId: string;
  isConnected: boolean;
  listens: string[];
  styleCalls: string[];
  commands: string[];
  mark?: string;
  remove?: () => void;
};

function installMuxElements(created: MuxNode[]): () => void {
  const doc = minimalDocument();
  const original = doc.createElement.bind(doc);
  doc.createElement = (tag: string) => {
    const node = original(tag);
    Object.defineProperty(node, "isConnected", {
      configurable: true,
      get() {
        return doc.contains(node);
      },
    });
    if (tag !== "mux-player") return node;
    const listens: string[] = [];
    const styleCalls: string[] = [];
    const commands: string[] = [];
    const mux = node as unknown as MuxNode;
    mux.listens = listens;
    mux.styleCalls = styleCalls;
    mux.commands = commands;
    mux.muted = false;
    mux.autoplay = false;
    mux.playbackId = "";
    const media = node as unknown as { pause: () => void; play: () => void };
    media.pause = () => {
      commands.push("pause");
    };
    media.play = () => {
      commands.push("play");
    };
    Object.defineProperty(node, "style", {
      configurable: true,
      writable: true,
      value: {
        setProperty(name: string, value: string) {
          styleCalls.push(`${name}=${value}`);
        },
      },
    });
    Object.defineProperty(node, "addEventListener", {
      configurable: true,
      writable: true,
      value(type: string) {
        listens.push(type);
      },
    });
    created.push(mux);
    return node;
  };
  return () => {
    doc.createElement = original;
  };
}

function playersIn(node: MuxNode): MuxNode[] {
  const found: MuxNode[] = [];
  const walk = (current: MuxNode) => {
    if (current.tagName === "MUX-PLAYER") found.push(current);
    for (const child of current.childNodes ?? []) walk(child);
  };
  walk(node);
  return found;
}

describe("SocialMuxPlayerMount", () => {
  let root: Root | null = null;
  let container: MuxNode | null = null;
  let restore: (() => void) | null = null;
  let created: MuxNode[] = [];

  afterAll(() => {
    uninstallMinimalDocument();
  });

  beforeEach(() => {
    created = [];
    restore = installMuxElements(created);
  });

  afterEach(() => {
    if (root) {
      const mounted = root;
      act(() => {
        mounted.unmount();
      });
    }
    root = null;
    container?.remove?.();
    container = null;
    restore?.();
    restore = null;
  });

  async function render(props: QuietMuxPlayerProps) {
    if (!root) {
      const host = minimalDocument();
      const node = host.createElement("div");
      host.body.appendChild(node);
      container = node as unknown as MuxNode;
      root = createRoot(node as unknown as HTMLElement);
    }
    await act(async () => {
      root?.render(<SocialMuxPlayerMount {...props} />);
    });
    await act(async () => {
      for (let i = 0; i < 8; i += 1) await Promise.resolve();
    });
  }

  function mark(node: MuxNode): string {
    if (!node.mark) node.mark = `mux-${created.indexOf(node) + 1}`;
    return node.mark;
  }

  function livePlayer(): MuxNode {
    if (!container) throw new Error("mount host missing");
    const found = playersIn(container);
    if (found.length !== 1) throw new Error(`expected 1 mux-player, found ${found.length}`);
    const player = found[0];
    if (!player) throw new Error("mux-player missing");
    return player;
  }

  it("keeps the same player when muted or autoplay changes", async () => {
    await render(BASE);
    const first = livePlayer();
    const id = mark(first);
    expect(created.map(mark)).toEqual([id]);
    expect(mark(livePlayer())).toBe(id);
    expect(first.muted).toBe(false);
    expect(first.autoplay).toBe(true);
    expect(first.commands).toEqual(["play"]);
    expect(first.playbackId).toBe(BASE.playbackId);
    const styleCalls = [...first.styleCalls];
    const listens = [...first.listens];
    expect(listens).toEqual(["loadeddata"]);

    await render({ ...BASE, muted: true });
    expect(created.map(mark)).toEqual([id]);
    expect(mark(livePlayer())).toBe(id);
    expect(first.muted).toBe(true);
    expect(first.autoplay).toBe(true);
    expect(first.commands).toEqual(["play", "play"]);
    expect(first.listens).toEqual(listens);
    expect(first.styleCalls).toEqual(styleCalls);

    await render({ ...BASE, muted: true, autoPlay: false });
    expect(created.map(mark)).toEqual([id]);
    expect(mark(livePlayer())).toBe(id);
    expect(first.muted).toBe(true);
    expect(first.autoplay).toBe(false);
    expect(first.commands).toEqual(["play", "play", "pause"]);
    expect(first.playbackId).toBe(BASE.playbackId);
    expect(first.listens).toEqual(listens);
    expect(first.styleCalls).toEqual(styleCalls);

    await render({ ...BASE, muted: true, autoPlay: true });
    expect(created.map(mark)).toEqual([id]);
    expect(mark(livePlayer())).toBe(id);
    expect(first.autoplay).toBe(true);
    expect(first.commands).toEqual(["play", "play", "pause", "play"]);
    expect(first.playbackId).toBe(BASE.playbackId);
  });

  it("mounts a new player when the playback id changes", async () => {
    await render(BASE);
    const first = livePlayer();
    const firstId = mark(first);
    await render({ ...BASE, playbackId: "zzNewPlayback99" });
    const next = livePlayer();
    expect(created.map(mark)).toEqual([firstId, mark(next)]);
    expect(mark(next)).not.toBe(firstId);
    expect(next.playbackId).toBe("zzNewPlayback99");
    expect(first.isConnected).toBe(false);
    expect(next.isConnected).toBe(true);
  });
});
