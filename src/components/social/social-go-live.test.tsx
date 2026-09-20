import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { SOCIAL_GO_LIVE_MAX_MS } from "@/lib/social-go-live";

const src = readFileSync("src/components/social/social-go-live.tsx", "utf8");
const page = readFileSync("src/app/(app)/social/create/live/page.tsx", "utf8");

describe("Social Go live recorder", () => {
  it("records in-app then posts on the normal video path with a 10:00 cap", () => {
    expect(page).toContain("SocialGoLive");
    expect(page).toContain("data-social-go-live-page");
    expect(src).toContain("data-social-go-live");
    expect(src).toContain("data-social-go-live-timer");
    expect(src).toContain("MediaRecorder");
    expect(src).toContain("createSocialPost");
    expect(src).toContain("presignSocialMediaUpload");
    expect(src).toContain('lane", "posts"');
    expect(src).toContain("goLiveReachedCap");
    expect(src).toContain("SOCIAL_GO_LIVE_MAX_MS");
    expect(src).toContain("HouseVoiceMic");
    expect(src).toContain('surface="dictate"');
    expect(src).not.toContain("Mux");
    expect(src).not.toContain("IVS");
    expect(src).not.toContain("WebRTC");
    expect(SOCIAL_GO_LIVE_MAX_MS).toBe(600_000);
    expect(SOCIAL.create.liveHint).toContain("10 minutes");
    expect(SOCIAL_ROUTES.createLive).toBe("/social/create/live");
  });
});
