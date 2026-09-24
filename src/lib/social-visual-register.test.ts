import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  SOCIAL_STORY_ACTIVATE_NEXT_CLASS,
  SOCIAL_STORY_ACTIVATE_PREV_CLASS,
  SOCIAL_STORY_PROGRESS_FILL_CLASS,
  SOCIAL_STORY_SHUTTER_CLASS,
  SOCIAL_STORY_STAGE_CLASS,
  SOCIAL_STORY_STAGE_IN_CLASS,
  SOCIAL_STORY_STILL_PROGRESS_MS,
} from "@/lib/social-chrome";

const css = readFileSync("src/app/globals.css", "utf8");
const motion = css.slice(css.indexOf("Rich calm v1.1"));
const viewer = readFileSync("src/components/social/social-story-viewer.tsx", "utf8");
const rail = readFileSync("src/components/social/social-stories-rail.tsx", "utf8");
const cover = readFileSync("src/components/social/social-story-rail-cover.tsx", "utf8");

describe("rich calm visual register v1.1", () => {
  it("paints viewer and rail motion and leaves the create shutter at v1.5", () => {
    expect(SOCIAL_STORY_STAGE_IN_CLASS).toBe("social-story-stage-in");
    expect(SOCIAL_STORY_ACTIVATE_NEXT_CLASS).toBe("social-story-activate");
    expect(SOCIAL_STORY_ACTIVATE_PREV_CLASS).toBe("social-story-activate-prev");
    expect(SOCIAL_STORY_PROGRESS_FILL_CLASS).toBe("social-story-progress");
    expect(SOCIAL_STORY_STILL_PROGRESS_MS).toBe(5000);
    expect(motion).toContain("animation: social-story-stage-in 180ms ease-out both");
    expect(motion).toContain("animation: social-story-activate 220ms ease-out both");
    expect(motion).toContain("animation: social-story-activate-prev 220ms ease-out both");
    expect(motion).toContain("animation-timing-function: linear");
    expect(motion).not.toMatch(/bounce|spring|parallax/i);
    expect(motion).not.toMatch(/box-shadow|drop-shadow/);
    expect(motion).not.toContain("social-story-shutter");
    expect(SOCIAL_STORY_SHUTTER_CLASS).toBe(
      "flex size-[72px] items-center justify-center justify-self-center rounded-full border-4 border-band-ink",
    );
    expect(SOCIAL_STORY_SHUTTER_CLASS).toContain("size-[72px]");
    expect(SOCIAL_STORY_SHUTTER_CLASS).not.toMatch(/shadow/);
    expect(SOCIAL_STORY_STAGE_CLASS).not.toMatch(/shadow/);
    expect(viewer).toContain("markStoryEnter");
    expect(viewer).toContain("SOCIAL_STORY_STILL_PROGRESS_MS");
    expect(viewer).toContain("currentTime / node.duration");
    expect(viewer).not.toMatch(/shadow-/);
    expect(rail).not.toMatch(/shadow-/);
    expect(cover).not.toMatch(/autoPlay|autoplay/);
    expect(readFileSync("docs/design-locks/24frame-visual-register-rich-calm-lock-v1.md", "utf8")).toContain(
      "Does not** reopen geometry",
    );
  });
});
