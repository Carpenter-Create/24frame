import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  hostnameFromEnvHost,
  imageRemotePatterns,
  MEDIA_CLOUDFRONT_HOST_FALLBACK,
  TITLE_CLOUDFRONT_HOST_FALLBACK,
  TITLE_S3_DEV_HOST,
} from "./image-remote-hosts";

describe("imageRemotePatterns", () => {
  it("allowlists title + Social media CloudFront and regional S3 without new env names", () => {
    const patterns = imageRemotePatterns({
      CLOUDFRONT_DOMAIN: "https://delivery.example.co",
      MEDIA_CLOUDFRONT_DOMAIN: "https://d364lvgeu9rmwn.cloudfront.net",
      AWS_REGION: "us-east-1",
      MEDIA_AWS_REGION: "us-west-2",
      S3_AVATARS_BUCKET: "test-avatars-bucket",
      S3_MEDIA_SOURCE_BUCKET: "test-media-source-bucket",
    });
    const hosts = patterns.map((pattern) => pattern.hostname);
    expect(hosts).toContain("delivery.example.co");
    expect(hosts).toContain("d364lvgeu9rmwn.cloudfront.net");
    expect(hosts).toContain(TITLE_S3_DEV_HOST);
    expect(hosts).toContain("s3.us-east-1.amazonaws.com");
    expect(hosts).toContain("s3.us-west-2.amazonaws.com");
    expect(hosts).toContain("*.s3.us-east-1.amazonaws.com");
    expect(hosts).toContain("*.s3.us-west-2.amazonaws.com");
    expect(hosts).toContain("test-avatars-bucket.s3.us-east-1.amazonaws.com");
    expect(hosts).toContain("test-media-source-bucket.s3.us-west-2.amazonaws.com");
    expect(hosts).not.toContain("*.amazonaws.com");
  });

  it("uses the existing fallbacks when CloudFront env is absent", () => {
    const hosts = imageRemotePatterns({}).map((pattern) => pattern.hostname);
    expect(hosts).toContain(TITLE_CLOUDFRONT_HOST_FALLBACK);
    expect(hosts).toContain(MEDIA_CLOUDFRONT_HOST_FALLBACK);
    expect(hosts).toContain("s3.us-east-1.amazonaws.com");
    expect(hosts).toContain("s3.us-west-2.amazonaws.com");
  });

  it("parses a bare host the same as an https URL", () => {
    expect(hostnameFromEnvHost("media.example.net", MEDIA_CLOUDFRONT_HOST_FALLBACK)).toBe(
      "media.example.net",
    );
    expect(hostnameFromEnvHost("https://media.example.net/", MEDIA_CLOUDFRONT_HOST_FALLBACK)).toBe(
      "media.example.net",
    );
    expect(hostnameFromEnvHost("", TITLE_CLOUDFRONT_HOST_FALLBACK)).toBe(TITLE_CLOUDFRONT_HOST_FALLBACK);
  });

  it("is what next.config feeds the optimiser — no new vendor or env", () => {
    const src = readFileSync("next.config.ts", "utf8");
    expect(src).toContain("imageRemotePatterns");
    expect(src).toContain("minimumCacheTTL: 3600");
    expect(src).not.toContain("CLOUDINARY");
    expect(src).not.toContain("cloudflare");
    expect(src).not.toContain("NEXT_PUBLIC_");
  });
});
