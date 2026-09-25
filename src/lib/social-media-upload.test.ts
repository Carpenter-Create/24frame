import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("social post media upload SoT", () => {
  it("routes post and story videos to Mux and leaves stills on S3", () => {
    const src = readFileSync("src/lib/social-media-upload.ts", "utf8");
    const forms = readFileSync("src/components/social/social-forms.tsx", "utf8");
    const live = readFileSync("src/components/social/social-go-live.tsx", "utf8");
    const studio = readFileSync("src/components/social/social-story-studio.tsx", "utf8");
    expect(src).toContain("createSocialMuxUpload");
    expect(src).toContain("finalizeSocialMuxUpload");
    expect(src).toContain("presignSocialMediaUpload");
    expect(src).toContain('body.set("intent", options.intent ?? "video")');
    expect(src).toContain("original_quality");
    expect(src).toContain("probeSocialVideoPixels");
    expect(src).toContain('lane === "posts" || lane === "stories"');
    expect(src).not.toContain("NEXT_PUBLIC_MUX");
    expect(forms).toContain("uploadSocialPostMedia");
    expect(forms).toContain("originalQuality");
    expect(live).toContain("uploadSocialPostMedia");
    expect(live).toContain('intent: "live"');
    expect(studio).toContain("presignSocialMediaUpload");
    expect(studio).toContain("uploadSocialMuxVideoFile");
    expect(studio).toContain('lane: "stories"');
  });

  it("PUTs stills, Stories, and welcome with Content-Type only — no Cache-Control", () => {
    const stills = readFileSync("src/lib/social-media-upload.ts", "utf8");
    const stories = readFileSync("src/components/social/social-story-studio.tsx", "utf8");
    const welcome = readFileSync("src/components/social/social-profile-edit.tsx", "utf8");
    const presign = readFileSync("src/lib/s3-social-media.ts", "utf8");
    for (const src of [stills, stories, welcome]) {
      expect(src).toContain('headers: { "Content-Type": signed.contentType }');
      expect(src).not.toContain("Cache-Control");
    }
    const putFn = presign.slice(
      presign.indexOf("export async function presignSocialMediaPut"),
      presign.indexOf("export async function presignSocialMediaGet"),
    );
    expect(putFn).toContain("new PutObjectCommand");
    expect(putFn).toContain("ContentType: contentType");
    expect(putFn).toContain("ContentLength: contentLength");
    expect(putFn).not.toContain("CacheControl:");
    expect(presign).toContain("ResponseCacheControl: privateMaxAgeCacheControl");
  });
});
