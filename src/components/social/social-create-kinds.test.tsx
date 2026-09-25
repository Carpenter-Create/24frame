import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

import { SocialCreateCompose } from "./social-forms";
import { SEGMENTED_TRACK_PERSIST } from "@/lib/segmented-track";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_CREATE_MEDIA_ACCEPT } from "@/lib/social-create-media";
import { stashSocialHomeComposerMedia } from "@/lib/social-home-composer";

const src = readFileSync("src/components/social/social-forms.tsx", "utf8");

describe("Social create kinds", () => {
  it("enters the chosen mode directly — no second chooser on the compose form", () => {
    const write = renderToStaticMarkup(
      createElement(SocialCreateCompose, { authorName: "Ada Lovelace" }),
    );
    expect(write).toContain("data-social-create-form");
    expect(write).toContain('data-social-create-kind="text"');
    expect(write).toContain("data-social-create-author");
    expect(write).not.toContain("data-social-create-kinds");
    expect(write).not.toContain("data-social-create-well");
    expect(write).not.toContain(SOCIAL.create.media);
    expect(write).not.toContain(SOCIAL.create.goLive);
    expect(write).toContain(SOCIAL.home.attach);
    expect(write).toContain("data-social-create-attach");
    expect(write).toContain("autofocus");

    const pick = renderToStaticMarkup(
      createElement(SocialCreateCompose, {
        authorName: "Ada Lovelace",
        initialKind: "media",
      }),
    );
    expect(pick).toContain('data-social-create-kind="media"');
    expect(pick).toContain('data-social-create-media-step="pick"');
    expect(pick).toContain(`accept="${SOCIAL_CREATE_MEDIA_ACCEPT}"`);
    expect(pick).toContain("data-social-create-media-input");
    expect(pick).not.toContain("data-social-create-well");
    expect(pick).not.toContain(SOCIAL.create.dropEmpty);
    expect(pick).not.toContain(SOCIAL.create.caption);
    expect(pick).not.toContain(SOCIAL.home.submit);
    expect(pick).not.toContain("data-social-create-kinds");

    stashSocialHomeComposerMedia([
      new File(["still"], "still.jpg", { type: "image/jpeg" }),
    ]);
    const review = renderToStaticMarkup(
      createElement(SocialCreateCompose, {
        authorName: "Ada Lovelace",
        initialKind: "media",
      }),
    );
    expect(review).toContain('data-social-create-media-step="review"');
    expect(review).toContain("data-social-create-media-next");
    expect(review).toContain(SOCIAL.create.next);
    expect(review).toContain(SOCIAL.home.photoKind);
    expect(review).not.toContain(SOCIAL.create.caption);
    expect(review).not.toContain(SOCIAL.home.submit);
    expect(review).not.toContain(SOCIAL.create.dropEmpty);
    expect(review).not.toContain("data-social-create-well");

    stashSocialHomeComposerMedia([
      new File(["clip"], "clip.mp4", { type: "video/mp4" }),
    ]);
    const caption = renderToStaticMarkup(
      createElement(SocialCreateCompose, {
        authorName: "Ada Lovelace",
        initialKind: "media",
        initialStep: "caption",
      }),
    );
    expect(caption).toContain('data-social-create-kind="media"');
    expect(caption).toContain('data-social-create-media-step="caption"');
    expect(caption).toContain(SOCIAL.create.caption);
    expect(caption).toContain(SOCIAL.home.submit);
    expect(caption).toContain(SOCIAL.home.captionPlaceholder);
    expect(caption).not.toContain("required");
    expect(caption).not.toContain(SOCIAL.create.dropEmpty);
    expect(caption).not.toContain("data-social-create-well");
    expect(caption).not.toContain("data-social-create-media-next");
    expect(caption).not.toContain("data-social-create-attach");
    expect(caption).not.toContain("autofocus");

    expect(src).not.toContain("SegmentedTrack");
    expect(src).not.toContain("data-social-create-kinds");
    expect(src).not.toContain("SOCIAL_CREATE_KINDS.map");
    expect(src).not.toContain("setKind");
    expect("socialCreateKind" in SEGMENTED_TRACK_PERSIST).toBe(false);
  });
});
