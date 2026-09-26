import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ src }: { src: string }) => createElement("img", { src, alt: "" }),
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function MuxPlayerStub() {
      return null;
    },
}));

import { SOCIAL } from "@/lib/social";
import { SocialDmThread, type DmThreadViewMessage } from "./social-dm-thread";
import { SocialDmPostShare } from "./social-dm-post-share";

describe("SocialDmPostShare", () => {
  it("plays a Mux video and does not mount a file video", () => {
    const src = readFileSync("src/components/social/social-dm-post-share.tsx", "utf8");
    expect(src).toContain("SocialMuxPlayer");
    expect(src).not.toContain("SocialFeedVideo");
    expect(src).not.toContain("<video");

    const mux = renderToStaticMarkup(
      createElement(SocialDmPostShare, {
        authorName: "ada",
        authorPhotoUrl: null,
        caption: "DO YALL KNOW",
        kind: "video",
        url: null,
        playbackId: "abc12345xx",
        href: "/social/p/p1",
      }),
    );
    expect(mux).toContain('data-social-dm-post-share=""');
    expect(mux).toContain("w-[240px]");
    expect(mux).toContain("aspect-square");
    expect(mux).toContain("rounded-[8px]");
    expect(mux).toContain('data-social-mux-player="abc12345xx"');
    expect(mux).toContain("DO YALL KNOW");
    expect(mux).toContain('href="/social/p/p1"');
    expect(mux).not.toContain("<video");
    expect(mux).not.toContain("truncate");
    expect(mux).not.toContain("line-clamp");

    const file = renderToStaticMarkup(
      createElement(SocialDmPostShare, {
        authorName: "ada",
        authorPhotoUrl: null,
        caption: "DO YALL KNOW",
        kind: null,
        url: null,
        href: "/social/p/p1",
      }),
    );
    expect(file).not.toContain("<video");
    expect(file).not.toContain("data-social-mux-player");
    expect(file).toContain("DO YALL KNOW");
  });

  it("sides a post share with the sender and keeps the note above the card", () => {
    const message: DmThreadViewMessage = {
      id: "m1",
      senderId: "u1",
      createdAt: "2026-09-24T15:09:00.000Z",
      mine: true,
      senderName: "Ada",
      senderPhotoUrl: null,
      text: null,
      story: null,
      post: {
        comment: "watch this",
        line: SOCIAL.dms.youSentPost("ada"),
        authorName: "ada",
        authorPhotoUrl: null,
        caption: "DO YALL KNOW",
        kind: "image",
        url: "/api/social/media?key=still.jpg",
        href: "/social/p/p1",
      },
    };
    const html = renderToStaticMarkup(
      createElement(SocialDmThread, { messages: [message], now: new Date("2026-09-24T15:10:00.000Z") }),
    );
    expect(html).toContain('data-social-dm-align="mine"');
    expect(html).toContain("justify-end");
    expect(html).toContain("items-end");
    expect(html).toContain("watch this");
    expect(html.replace(/&#x27;/g, "'")).toContain(SOCIAL.dms.youSentPost("ada"));
    expect(html).not.toContain("max-w-[168px]");
    expect(html).toContain("data-social-dm-post-share");
    expect(html).toContain("data-social-dm-post-photo");
    expect(html).not.toContain("<video");
    expect(html.indexOf("watch this")).toBeLessThan(html.indexOf("data-social-dm-post-share"));
  });
});
