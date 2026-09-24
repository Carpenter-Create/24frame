import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ src }: { src: string }) => createElement("img", { src, alt: "" }),
}));

import { APP_SHEET_HOST_CLASS } from "@/lib/house-sheet";
import { SOCIAL } from "@/lib/social";
import { SocialStorySendSheet } from "./social-story-send-sheet";

const person = {
  id: "u2",
  name: "Ada Lovelace",
  handle: "ada",
  photoUrl: null,
};

describe("SocialStorySendSheet", () => {
  it("shows one person row and closes only through the success helper", () => {
    const src = readFileSync("src/components/social/social-story-send-sheet.tsx", "utf8");
    const html = renderToStaticMarkup(
      createElement(SocialStorySendSheet, {
        storyId: "s1",
        open: true,
        onClose: () => undefined,
        directory: [person],
      }),
    );
    expect(html).toContain("data-social-story-send-sheet");
    expect(html).toContain(APP_SHEET_HOST_CLASS);
    expect(html).toContain(SOCIAL.stories.send);
    expect(html).toContain("t-title");
    expect(html).toContain('data-social-story-send-row="u2"');
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("t-body");
    expect(html).toContain("size-10");
    expect(html).toContain("gap-3");
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toContain("share-network");
    expect(src).toContain("storySendUiAfter");
    expect(src).toContain("if (outcome.close)");
    expect(src).toContain("onClose()");
    expect(src).toContain("sendSocialStoryItem");
    expect(src).toContain("HouseDialogFrame");
    expect(src).toContain('data-house-overlay-host="app-sheet"');
    expect(src).not.toMatch(/ThumbsUp|thumbs-up|thumbs-down|navigator\.share|type="checkbox"/);
    expect(src).not.toContain("multi");
  });

  it("uses the calm empty when nobody is available", () => {
    const html = renderToStaticMarkup(
      createElement(SocialStorySendSheet, {
        storyId: "s1",
        open: true,
        onClose: () => undefined,
        directory: [],
      }),
    );
    expect(html).toContain("data-social-story-send-empty");
    expect(html).toContain(SOCIAL.stories.sendEmpty);
    expect(html).toContain("t-body-sm");
    expect(SOCIAL.stories.sendEmpty).toBe("No people yet.");
  });

  it("renders nothing when closed", () => {
    const html = renderToStaticMarkup(
      createElement(SocialStorySendSheet, {
        storyId: "s1",
        open: false,
        onClose: () => undefined,
        directory: [person],
      }),
    );
    expect(html).toBe("");
  });
});
