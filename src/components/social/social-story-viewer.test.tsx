import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ src }: { src: string }) => createElement("img", { src, alt: "" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function MuxPlayerStub() {
      return null;
    },
}));

import { SocialStoryViewer } from "./social-story-viewer";

const viewerProps = {
  storyId: "s1",
  authorId: "u1",
  authorName: "Ada",
  authorPhotoUrl: null,
  createdAt: "2026-09-24T00:00:00.000Z",
  body: null,
  prevId: null,
  nextId: null,
  index: 0,
  total: 1,
  canReply: false,
};

describe("SocialStoryViewer", () => {
  it("stretches the story video frame to the shell width", () => {
    const html = renderToStaticMarkup(
      createElement(SocialStoryViewer, {
        ...viewerProps,
        media: [{ kind: "video", url: "/api/social/media?key=stories%2Forg%2Fclip.mp4" }],
      }),
    );
    expect(html).toContain('data-social-story-viewer="s1"');
    expect(html).toContain("data-social-post-video");
    expect(html).toContain("/api/social/media?key=stories%2Forg%2Fclip.mp4#t=0.1");
    expect(html).not.toContain("<img");
    const stage = html.slice(html.indexOf("min-h-[360px]"));
    expect(stage).toContain('data-social-story-frame=""');
    expect(stage).toContain("w-full self-stretch");
    expect(stage).toContain("aspect-[9/16]");
    expect(stage).not.toContain("aspect-video");
    expect(stage).not.toContain("aspect-[4/5]");
    expect(stage.indexOf("w-full self-stretch")).toBeLessThan(stage.indexOf("data-social-post-video"));
    const still = renderToStaticMarkup(
      createElement(SocialStoryViewer, {
        ...viewerProps,
        media: [{ kind: "image", url: "/api/social/media?key=stories%2Forg%2Fstill.jpg" }],
      }),
    );
    const stillStage = still.slice(still.indexOf("min-h-[360px]"));
    expect(stillStage).toContain("aspect-[9/16]");
    expect(stillStage).not.toContain("aspect-video");
    expect(stillStage).not.toContain("aspect-[4/5]");
  });
});
