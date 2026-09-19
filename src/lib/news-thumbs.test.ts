import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import {
  backfillNewsThumbUrls,
  isMirroredNewsThumbUrl,
  isNewsThumbMirrorConfigured,
  mirrorNewsImageUrl,
  NEWS_THUMBS_PREFIX,
  newsThumbObjectKey,
  planNewsThumbBackfill,
  previewNewsThumbPublicUrl,
} from "./news-thumbs";

const FLOOD_CANON = "https://joblo.com/zach-cregger-the-flood-2001-influence";
const FLOOD_APEX =
  "https://joblo.com/wp-content/uploads/2026/09/zach-cregger-the-flood-2001.jpg";
const FLOOD_WWW =
  "https://www.joblo.com/wp-content/uploads/2026/09/zach-cregger-the-flood-2001.jpg";
const CF = "https://delivery.globalcontent.co";
const MIRROR_ENV = {
  S3_BUCKET: "gc-content-assets-prod",
  AWS_REGION: "us-east-1",
  CLOUDFRONT_DOMAIN: CF,
};

function jpegResponse(): Response {
  return new Response(new Uint8Array(64).fill(1), {
    status: 200,
    headers: { "content-type": "image/jpeg" },
  });
}

describe("news thumb key + public URL", () => {
  it("stays under news-thumbs/ and builds the title CloudFront URL", () => {
    const key = newsThumbObjectKey("joblo", FLOOD_CANON, "jpg");
    expect(key.startsWith(NEWS_THUMBS_PREFIX)).toBe(true);
    expect(key).toMatch(/^news-thumbs\/joblo\/[0-9a-f]{32}\.jpg$/);
    expect(key).not.toContain("orgs/");
    expect(previewNewsThumbPublicUrl("joblo", FLOOD_CANON, FLOOD_WWW, MIRROR_ENV)).toBe(
      `${CF}/${key}`,
    );
    expect(isMirroredNewsThumbUrl(`${CF}/${key}`, MIRROR_ENV)).toBe(true);
    expect(isMirroredNewsThumbUrl(FLOOD_WWW, MIRROR_ENV)).toBe(false);
    expect(isNewsThumbMirrorConfigured({})).toBe(false);
    expect(isNewsThumbMirrorConfigured(MIRROR_ENV)).toBe(true);
  });
});

describe("mirrorNewsImageUrl", () => {
  it("writes the CloudFront URL on a successful PutObject", async () => {
    const putObject = vi.fn(async () => undefined);
    const result = await mirrorNewsImageUrl({
      source: "joblo",
      canonicalUrl: FLOOD_CANON,
      remoteUrl: FLOOD_APEX,
      fetchImpl: async () => jpegResponse(),
      putObject,
      env: MIRROR_ENV,
    });
    const key = newsThumbObjectKey("joblo", FLOOD_CANON, "jpg");
    expect(putObject).toHaveBeenCalledTimes(1);
    expect(putObject).toHaveBeenCalledWith(key, expect.any(Uint8Array), "image/jpeg");
    expect(result.mirrored).toBe(true);
    expect(result.url).toBe(`${CF}/${key}`);
  });

  it("keeps the canonicalized remote URL when PutObject fails", async () => {
    const result = await mirrorNewsImageUrl({
      source: "joblo",
      canonicalUrl: FLOOD_CANON,
      remoteUrl: FLOOD_APEX,
      fetchImpl: async () => jpegResponse(),
      putObject: async () => {
        throw new Error("AccessDenied");
      },
      env: MIRROR_ENV,
    });
    expect(result.mirrored).toBe(false);
    expect(result.url).toBe(FLOOD_WWW);
    expect(result.error).toBe("AccessDenied");
  });
});

describe("backfillNewsThumbUrls dry-run", () => {
  it("previews the CF URL and does not PutObject or write Dynamo", async () => {
    const putObject = vi.fn(async () => undefined);
    const writeItem = vi.fn(async () => undefined);
    const logs: string[] = [];
    const summary = await backfillNewsThumbUrls({
      apply: false,
      fillKnown: false,
      allSources: false,
      rows: [
        {
          source: "joblo",
          url: FLOOD_CANON,
          canonical_url: FLOOD_CANON,
          image_url: FLOOD_APEX,
        },
        {
          source: "variety",
          url: "https://variety.com/live",
          canonical_url: "https://variety.com/live",
          image_url: "https://variety.com/thumbs/harbor.jpg",
        },
      ],
      putObject,
      writeItem,
      env: MIRROR_ENV,
      log: (line) => logs.push(line),
    });
    expect(summary.rewrite).toBe(1);
    expect(summary.unchanged).toBe(1);
    expect(summary.wrote).toBe(0);
    expect(putObject).not.toHaveBeenCalled();
    expect(writeItem).not.toHaveBeenCalled();
    expect(logs.some((line) => line.includes(`${CF}/news-thumbs/joblo/`))).toBe(true);
    expect(
      planNewsThumbBackfill({
        source: "joblo",
        url: FLOOD_CANON,
        image_url: `${CF}/news-thumbs/joblo/abc.jpg`,
        env: MIRROR_ENV,
      }).action,
    ).toBe("unchanged");
  });
});

describe("news-thumbs house SoT", () => {
  it("reuses title S3_BUCKET + putObjectBytes and never invents NEWS_S3_*", () => {
    const src = readFileSync(new URL("./news-thumbs.ts", import.meta.url), "utf8");
    const s3Src = readFileSync(new URL("./s3.ts", import.meta.url), "utf8");
    const putSrc = readFileSync(new URL("./s3-put.ts", import.meta.url), "utf8");
    expect(src).toContain('from "@/lib/s3-put"');
    expect(src).toContain("putObjectBytes");
    expect(src).toContain("S3_BUCKET");
    expect(src).toContain("CLOUDFRONT_DOMAIN");
    expect(src).toContain(NEWS_THUMBS_PREFIX);
    expect(src).not.toMatch(/process\.env\.NEWS_S3_/);
    expect(src).not.toContain("EDUCATION_AWS_");
    expect(src).not.toContain("MEDIA_AWS_");
    expect(s3Src).toContain("export { putObjectBytes }");
    expect(putSrc).toContain("PutObjectCommand");
    expect(putSrc).toContain("S3_BUCKET");
    expect(putSrc).toContain("followRegionRedirects: true");
  });
});
