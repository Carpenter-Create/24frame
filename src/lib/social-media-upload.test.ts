import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("social post media upload SoT", () => {
  it("routes post videos to Mux and leaves stills + stories on S3", () => {
    const src = readFileSync("src/lib/social-media-upload.ts", "utf8");
    const forms = readFileSync("src/components/social/social-forms.tsx", "utf8");
    const live = readFileSync("src/components/social/social-go-live.tsx", "utf8");
    const studio = readFileSync("src/components/social/social-story-studio.tsx", "utf8");
    expect(src).toContain("createSocialMuxUpload");
    expect(src).toContain("finalizeSocialMuxUpload");
    expect(src).toContain("presignSocialMediaUpload");
    expect(src).toContain('intent: options.intent ?? "video"');
    expect(src).toContain("original_quality");
    expect(src).toContain("probeSocialVideoPixels");
    expect(src).not.toContain("NEXT_PUBLIC_MUX");
    expect(forms).toContain("uploadSocialPostMedia");
    expect(forms).toContain("originalQuality");
    expect(live).toContain("uploadSocialPostMedia");
    expect(live).toContain('intent: "live"');
    expect(studio).toContain("presignSocialMediaUpload");
    expect(studio).not.toContain("createSocialMuxUpload");
    expect(studio).not.toContain("uploadSocialPostMedia");
  });
});
