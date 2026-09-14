import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SocialStoryCompose } from "./social-story-studio";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_FIGMA_STORY_PICKER,
  SOCIAL_FIGMA_STORY_STUDIO,
  SOCIAL_STORY_PICKER_CLASS,
} from "@/lib/social-chrome";

describe("SocialStoryCompose picker", () => {
  it("opens Record as in-app studio and keeps Upload as the file picker", () => {
    const html = renderToStaticMarkup(<SocialStoryCompose />);
    expect(html).toContain("data-social-story-picker");
    expect(html).toContain("data-social-story-record");
    expect(html).toContain("data-social-story-upload");
    expect(html).toContain(SOCIAL.stories.createCta);
    expect(html).toContain(SOCIAL.stories.pickerHint);
    expect(html).toContain(SOCIAL.stories.record);
    expect(html).toContain(SOCIAL.stories.recordHint);
    expect(html).toContain(SOCIAL.stories.upload);
    expect(html).toContain(SOCIAL.stories.footnote);
    expect(html).toContain(SOCIAL_STORY_PICKER_CLASS);
    expect(html).not.toContain("data-social-story-studio");
    expect(html).not.toContain(SOCIAL.home.photoKind);
  });

  it("keeps MediaRecorder as the Record path and never uses OS capture", () => {
    const src = readFileSync("src/components/social/social-story-studio.tsx", "utf8");
    expect(src).toContain("navigator.mediaDevices.getUserMedia");
    expect(src).toContain("new MediaRecorder");
    expect(src).toContain("probeStoryRecorderMimeType");
    expect(src).toContain('lane", "stories"');
    expect(src).toContain("createSocialStory");
    expect(src).not.toContain("capture=");
    expect(src).not.toContain('capture="user"');
    expect(src).not.toContain("15");
    expect(src).toContain('data-social-story-studio={phase}');
    expect(src).toContain("storyStudioIsLive");
    expect(SOCIAL_FIGMA_STORY_STUDIO).toEqual([
      "146:230",
      "146:1050",
      "146:1072",
      "146:1099",
      "146:1125",
      "146:1147",
      "146:1173",
      "147:251",
    ]);
    expect(SOCIAL_FIGMA_STORY_PICKER).toEqual(["144:1218", "144:1444"]);
  });
});
