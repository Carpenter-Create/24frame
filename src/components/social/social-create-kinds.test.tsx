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
const chrome = readFileSync("src/lib/social-chrome.ts", "utf8");

describe("Social create kinds", () => {
  it("enters the chosen mode directly — no second chooser on the compose form", () => {
    const write = renderToStaticMarkup(
      createElement(SocialCreateCompose, {
        authorName: "Ada Lovelace",
        authorHandle: "acarpcreate",
      }),
    );
    expect(write).toContain("data-social-create-form");
    expect(write).toContain('data-social-create-kind="text"');
    expect(write).toContain("data-social-create-author");
    expect(write).not.toContain("data-social-create-kinds");
    expect(write).not.toContain("data-social-create-well");
    expect(write).not.toContain(SOCIAL.create.media);
    expect(write).not.toContain(SOCIAL.create.goLive);
    expect(write).toContain("data-social-create-dismiss");
    expect(write).toContain(`aria-label="${SOCIAL.create.close}"`);
    expect(write).toContain('data-social-create-attach="photo"');
    expect(write).toContain('data-social-create-attach="video"');
    expect(write).toContain(`aria-label="${SOCIAL.create.photo}"`);
    expect(write).toContain(`aria-label="${SOCIAL.create.video}"`);
    expect(write).toContain('aria-label="Add photo or video"');
    expect(write).not.toContain(`>${SOCIAL.home.attach}<`);
    expect(write).toContain("size-10");
    expect(write).toContain("gap-2");
    expect(write).toContain('width="24"');
    expect(write).toContain('width="22"');
    expect(write).toContain("size-11");
    expect(write).toContain("size-[220px]");
    expect(write).toContain("size-14");
    expect(write).toContain("leading-none");
    expect(write).toContain("items-center");
    expect(write).toContain("min-h-dvh");
    expect(write).toContain("max-w-[680px]");
    expect(write).toContain("h-12");
    expect(write).toContain("rounded-[24px]");
    expect(write).toContain(`placeholder="${SOCIAL.home.composerPrompt}"`);
    expect(write).not.toContain(SOCIAL.create.caption);
    expect(write).not.toContain("data-house-voice-mic=\"search\"");
    expect(write).toContain('data-house-voice-mic="dictate"');
    expect(write).toContain('aria-label="Voice"');
    expect(write).toContain("data-social-write-voice");
    expect(write).not.toContain(`>${SOCIAL.home.photoKind}<`);
    expect(write).not.toContain(SOCIAL.home.audienceFollowing);
    expect(write).not.toContain("@acarpcreate");
    expect(write).toContain("social-story-stage-in");
    expect(write).toContain(SOCIAL.home.submit);
    expect(write).not.toContain("autofocus");
    expect(src.indexOf("data-social-create-preview")).toBeLessThan(src.indexOf('id="social-create-body"'));
    expect(src.indexOf('id="social-create-body"')).toBeLessThan(src.indexOf('presentation="hero"'));
    expect(src.indexOf('presentation="hero"')).toBeLessThan(src.indexOf("data-social-create-attach-row"));
    expect(src).toContain("size={20}");
    expect(src).toContain("unoptimized");
    expect(chrome).toContain(
      "relative h-[50vh] max-h-[50vh] w-full overflow-hidden rounded-[16px] bg-surface-muted",
    );
    expect(chrome).toContain(
      "-mx-[var(--space-4)] flex h-12 items-center justify-between gap-[var(--space-4)] border-b border-hairline px-[var(--space-4)]",
    );
    expect(chrome).toContain(
      "inline-flex h-10 shrink-0 items-center justify-center rounded-[8px] bg-accent px-[var(--space-4)] t-body-sm font-medium text-accent-contrast",
    );
    expect(chrome).toContain(
      "flex size-[220px] shrink-0 items-center justify-center rounded-full border border-hairline bg-[#EEEEF0] text-ink",
    );
    expect(chrome).toContain(
      "flex h-12 w-full items-center rounded-[24px] bg-[#EEEEF0] px-[var(--space-4)]",
    );
    expect(chrome).toContain("py-0 text-[length:var(--text-sm)] leading-none");
    expect(chrome).not.toContain("size-48 shrink-0");
    expect(src).toContain("data-social-write-voice-stage");
    const voice = readFileSync("src/components/chrome/house-voice-mic.tsx", "utf8");
    expect(voice).toContain('weight={hero ? "fill"');
    expect(voice).toContain('className={hero ? "size-14"');
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toContain("body:has([data-social-write-compose])");
    expect(css).toContain("#vercel-toolbar");
    const dismiss = src.slice(
      src.indexOf("data-social-create-dismiss"),
      src.indexOf("data-social-create-author"),
    );
    expect(dismiss).toContain("leaveSocialWriteCompose");
    expect(dismiss).toContain("navigateOwned(SOCIAL_ROUTES.home)");
    expect(dismiss).toContain("router.push(SOCIAL_ROUTES.home)");
    expect(dismiss).not.toContain("router.back()");

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
    expect(caption).not.toContain(SOCIAL.home.audienceFollowing);

    expect(src).not.toContain("SegmentedTrack");
    expect(src).not.toContain("data-social-create-kinds");
    expect(src).not.toContain("SOCIAL_CREATE_KINDS.map");
    expect(src).not.toContain("setKind");
    expect("socialCreateKind" in SEGMENTED_TRACK_PERSIST).toBe(false);
  });
});
