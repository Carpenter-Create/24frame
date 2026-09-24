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

import { SOCIAL_STORY_ACTIVE_CARD_CLASS, SOCIAL_STORY_STAGE_CLASS } from "@/lib/social-chrome";
import { SocialStoryViewer } from "./social-story-viewer";

const viewerProps = {
  storyId: "s1",
  authorId: "u1",
  authorName: "Ada Lovelace",
  authorPhotoUrl: null,
  createdAt: "2026-09-24T00:00:00.000Z",
  body: null,
  prevId: null,
  nextId: null,
  prevAuthor: null,
  nextAuthor: null,
  index: 0,
  total: 1,
  canReply: false,
};

const neighbor = {
  storyId: "s-prev",
  authorName: "Grace Hopper",
  authorPhotoUrl: null,
  createdAt: "2026-09-24T00:00:00.000Z",
  unseen: true,
  coverUrl: "/api/social/media?key=stories%2Fprev.jpg",
  coverKind: "image" as const,
};

describe("SocialStoryViewer", () => {
  it("opens a dark full-viewport 9:16 stage, not the light 420px card", () => {
    const html = renderToStaticMarkup(
      createElement(SocialStoryViewer, {
        ...viewerProps,
        media: [{ kind: "video", url: "/api/social/media?key=stories%2Forg%2Fclip.mp4" }],
        nextAuthor: { ...neighbor, storyId: "s-next", authorName: "Mary Keller" },
        prevAuthor: neighbor,
        canReply: true,
        total: 2,
        index: 0,
      }),
    );
    expect(html).toContain('data-social-story-stage=""');
    expect(html).toContain(SOCIAL_STORY_STAGE_CLASS);
    expect(html).toContain(SOCIAL_STORY_ACTIVE_CARD_CLASS);
    expect(html).toContain("md:h-[min(90vh-16px,840px)]");
    expect(SOCIAL_STORY_ACTIVE_CARD_CLASS).toContain("md:w-[calc(min(90vh-16px,840px)*9/16)]");
    expect(html).not.toContain("max-w-[420px]");
    expect(html).not.toContain("bg-surface p-");
    expect(html).toContain('data-social-story-viewer="s1"');
    expect(html).toContain("data-social-story-video");
    expect(html).toContain("/api/social/media?key=stories%2Forg%2Fclip.mp4#t=0.1");
    expect(html).toContain('data-social-story-frame=""');
    expect(html).toContain("data-social-story-pause");
    expect(html).toContain("data-social-story-mute");
    expect(html).toContain('data-social-story-neighbor="s-prev"');
    expect(html).toContain('data-social-story-neighbor="s-next"');
    expect(html).toContain("opacity-45");
    expect(html).toContain("border-accent");
    expect(html).toContain('data-social-story-mark=""');
    expect(html).toContain('href="/social"');
    expect(html).toContain("Reply to Ada Lovelace…");
    expect(html).toContain("data-social-story-heart");
    expect(html).toContain("bg-band-ink");
    expect(html).not.toContain("bg-accent");
    expect(html).not.toContain("paper-plane");
    expect(html).not.toContain("Instagram");
    expect(html).not.toContain("aspect-video");
    expect(html).not.toContain("aspect-[4/5]");
    const still = renderToStaticMarkup(
      createElement(SocialStoryViewer, {
        ...viewerProps,
        media: [{ kind: "image", url: "/api/social/media?key=stories%2Forg%2Fstill.jpg" }],
      }),
    );
    expect(still).toContain('data-social-story-frame=""');
    expect(still).not.toContain("data-social-story-pause");
    expect(still).not.toContain("data-social-story-mute");
    expect(still).not.toContain("data-social-story-neighbor");
    expect(still).not.toContain("aspect-video");
    expect(still).not.toContain("aspect-[4/5]");
    expect(still).toContain("social-story-progress");
    expect(still).toContain("animation-duration:5000ms");
  });
});
