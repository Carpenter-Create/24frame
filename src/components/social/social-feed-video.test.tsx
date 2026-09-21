import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function MuxPlayerStub() {
      return null;
    },
}));

import { SocialFeedVideo } from "./social-feed-video";

describe("SocialFeedVideo", () => {
  it("uses Mux Player when a playback id is present", () => {
    const html = renderToStaticMarkup(
      createElement(SocialFeedVideo, {
        item: { url: "https://image.mux.com/abc12345/thumbnail.webp", playbackId: "abc12345xx" },
        className: "h-[360px]",
      }),
    );
    expect(html).toContain('data-social-mux-player="abc12345xx"');
    expect(html).toContain("data-social-post-video");
    expect(html).not.toContain("<video");
  });

  it("keeps the naive player for leftover S3 videos", () => {
    const html = renderToStaticMarkup(
      createElement(SocialFeedVideo, {
        item: { url: "https://cf.example/signed-video" },
      }),
    );
    expect(html).toContain("data-social-post-video");
    expect(html).toContain("<video");
    expect(html).toContain("https://cf.example/signed-video#t=0.1");
    expect(html).not.toContain("data-social-mux-player");
  });

  it("does not add a quality Settings maze", () => {
    const player = readFileSync("src/components/social/social-mux-player.tsx", "utf8");
    expect(player).toContain("streamType=\"on-demand\"");
    expect(player).toContain("objectFit: \"cover\"");
    expect(player).toContain("aspectRatio: \"auto\"");
    expect(player).not.toContain("maxResolution");
    expect(player).not.toContain("minResolution");
    expect(player).not.toContain("renditionOrder");
  });
});
