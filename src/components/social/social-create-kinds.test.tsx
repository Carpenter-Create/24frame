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
  }),
}));

import { SocialCreateCompose } from "./social-forms";
import { SEGMENTED_TRACK_PERSIST } from "@/lib/segmented-track";
import { SOCIAL } from "@/lib/social";

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
    expect(write).not.toContain(SOCIAL.create.photo);
    expect(write).not.toContain(SOCIAL.create.video);
    expect(write).not.toContain(SOCIAL.create.goLive);

    const photo = renderToStaticMarkup(
      createElement(SocialCreateCompose, {
        authorName: "Ada Lovelace",
        initialKind: "photo",
      }),
    );
    expect(photo).toContain('data-social-create-kind="photo"');
    expect(photo).toContain("data-social-create-well");
    expect(photo).toContain(SOCIAL.create.dropEmpty);
    expect(photo).not.toContain("data-social-create-kinds");

    expect(src).not.toContain("SegmentedTrack");
    expect(src).not.toContain("data-social-create-kinds");
    expect(src).not.toContain("SOCIAL_CREATE_KINDS.map");
    expect(src).not.toContain("setKind");
    expect("socialCreateKind" in SEGMENTED_TRACK_PERSIST).toBe(false);
  });
});
