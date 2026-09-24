import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { educationCoverKey } from "@/lib/education";
import { presignEducationSourcePut } from "@/lib/s3-education";

const COVER = educationCoverKey("11111111-1111-4111-8111-111111111111", "image/jpeg");

// Real signer. The other s3-education tests mock getSignedUrl, which hides
// whether ContentLength is actually part of the signed headers.
describe("education browser PUT presign", () => {
  beforeEach(() => {
    process.env.EDUCATION_AWS_ACCESS_KEY_ID = "education-access-key";
    process.env.EDUCATION_AWS_SECRET_ACCESS_KEY = "education-secret-key";
    process.env.EDUCATION_AWS_REGION = "us-west-2";
    process.env.S3_EDUCATION_SOURCE_BUCKET = "test-education-source-bucket";
    process.env.S3_BUCKET = "test-bucket";
    process.env.S3_AVATARS_BUCKET = "test-avatars-bucket";
  });

  afterEach(() => {
    delete process.env.EDUCATION_AWS_ACCESS_KEY_ID;
    delete process.env.EDUCATION_AWS_SECRET_ACCESS_KEY;
    delete process.env.EDUCATION_AWS_REGION;
  });

  it("signs Content-Length and does not bind the empty sign-time CRC32", async () => {
    const url = await presignEducationSourcePut(COVER, "image/jpeg", 1200);
    const params = new URL(url).searchParams;
    expect(params.get("X-Amz-SignedHeaders")?.split(";").sort()).toEqual(["content-length", "host"]);
    expect(params.get("x-amz-checksum-crc32")).toBeNull();
    expect(params.get("x-amz-sdk-checksum-algorithm")).toBeNull();
    expect(url.toLowerCase()).not.toContain("x-amz-checksum-");
  });
});
