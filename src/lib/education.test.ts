import { describe, expect, it, afterEach } from "vitest";

import {
  EDUCATION_AWS_ACCOUNT,
  EDUCATION_AWS_REGION,
  EDUCATION_BUCKETS,
  EDUCATION_ADMIN,
  EDUCATION_HREF,
  assertEducationBucketName,
  educationCoverKey,
  educationCourseHref,
  educationHlsManifestKey,
  educationHlsPrefix,
  educationLessonSourceKey,
  educationCommercialLabel,
  educationEncodeLabel,
  educationPriceInputValue,
  educationProductModel,
  formatEducationPriceCents,
  isEducationObjectKey,
  parseEducationPriceDollars,
  resolveEducationProduct,
  isForbiddenEducationBucket,
  isForbiddenEducationKey,
  lessonPlaybackReady,
  mapMediaConvertJobStatus,
  normalizeCourseSlug,
  validateEducationUpload,
} from "./education";

const COURSE = "11111111-1111-4111-8111-111111111111";
const LESSON = "22222222-2222-4222-8222-222222222222";

describe("education names and keys", () => {
  afterEach(() => {
    delete process.env.S3_BUCKET;
    delete process.env.S3_AVATARS_BUCKET;
    delete process.env.S3_MEDIA_SOURCE_BUCKET;
    delete process.env.S3_MEDIA_OUTPUT_BUCKET;
    delete process.env.S3_FINANCE_BUCKET;
  });

  it("proposes the Education source/output pair on the E8 account", () => {
    expect(EDUCATION_AWS_ACCOUNT).toBe("405912452061");
    expect(EDUCATION_AWS_REGION).toBe("us-west-2");
    expect(EDUCATION_BUCKETS.source.prod).toBe("24frame-education-source-prod");
    expect(EDUCATION_BUCKETS.source.dev).toBe("24frame-education-source-dev");
    expect(EDUCATION_BUCKETS.output.prod).toBe("24frame-education-output-prod");
    expect(EDUCATION_BUCKETS.output.dev).toBe("24frame-education-output-dev");
    expect(EDUCATION_HREF).toBe("/education");
    expect(educationCourseHref("welcome-to-24frame")).toBe("/education/welcome-to-24frame");
    expect(EDUCATION_ADMIN.manage).toBe("Course management");
  });

  it("keeps object keys on the courses prefix", () => {
    expect(educationCoverKey(COURSE, "image/jpeg")).toBe(`courses/${COURSE}/cover.jpg`);
    expect(educationLessonSourceKey(COURSE, LESSON, "video/mp4")).toBe(
      `courses/${COURSE}/lessons/${LESSON}/source.mp4`,
    );
    expect(educationHlsPrefix(COURSE, LESSON)).toBe(`courses/${COURSE}/lessons/${LESSON}/hls/`);
    expect(educationHlsManifestKey(COURSE, LESSON)).toBe(
      `courses/${COURSE}/lessons/${LESSON}/hls/source.m3u8`,
    );
    expect(isEducationObjectKey(`courses/${COURSE}/cover.jpg`)).toBe(true);
    expect(isEducationObjectKey(`posts/${COURSE}/${LESSON}.jpg`)).toBe(false);
  });

  it("refuses title, finance, social, and avatar buckets", () => {
    expect(isForbiddenEducationBucket("24frame-education-source-dev")).toBe(false);
    expect(isForbiddenEducationBucket("24frame-media-source-prod")).toBe(true);
    expect(isForbiddenEducationBucket("gc-content-assets")).toBe(true);
    expect(isForbiddenEducationBucket("24frame-finance-prod")).toBe(true);
    expect(isForbiddenEducationBucket("gc-avatars-prod")).toBe(true);
    process.env.S3_BUCKET = "title-film-bucket";
    process.env.S3_FINANCE_BUCKET = "live-finance";
    process.env.S3_MEDIA_SOURCE_BUCKET = "live-media-source";
    expect(isForbiddenEducationBucket("title-film-bucket")).toBe(true);
    expect(isForbiddenEducationBucket("live-finance")).toBe(true);
    expect(isForbiddenEducationBucket("live-media-source")).toBe(true);
    expect(() => assertEducationBucketName("gc-content-assets", "S3_EDUCATION_SOURCE_BUCKET")).toThrow(
      /dedicated 24Frame education bucket/,
    );
  });

  it("refuses foreign key prefixes", () => {
    expect(isForbiddenEducationKey(`orgs/${COURSE}/titles/${LESSON}/master/a.mov`)).toBe(true);
    expect(isForbiddenEducationKey(`posts/${COURSE}/${LESSON}.jpg`)).toBe(true);
    expect(isForbiddenEducationKey(`avatars/${COURSE}/avatar`)).toBe(true);
    expect(isForbiddenEducationKey(`courses/${COURSE}/../cover.jpg`)).toBe(true);
  });

  it("normalizes slugs and upload bounds", () => {
    expect(normalizeCourseSlug(" Welcome To 24Frame ")).toBe("welcome-to-24frame");
    expect(normalizeCourseSlug("***")).toBeNull();
    expect(validateEducationUpload({ kind: "cover", contentType: "image/png", byteLength: 12 })).toMatchObject({
      ok: true,
    });
    expect(validateEducationUpload({ kind: "source", contentType: "image/png", byteLength: 12 })).toMatchObject({
      ok: false,
      error: "type",
    });
  });

  it("treats complete + playback key as ready", () => {
    expect(
      lessonPlaybackReady({
        encode_status: "complete",
        hls_key: educationHlsManifestKey(COURSE, LESSON),
      }),
    ).toBe(true);
    expect(lessonPlaybackReady({ encode_status: "running", hls_key: educationHlsManifestKey(COURSE, LESSON) })).toBe(
      false,
    );
    expect(educationEncodeLabel("complete")).toBe("Complete");
    expect(mapMediaConvertJobStatus("PROGRESSING")).toBe("running");
    expect(mapMediaConvertJobStatus("COMPLETE")).toBe("complete");
    expect(mapMediaConvertJobStatus("ERROR")).toBe("failed");
  });

  it("maps Free to flagship with a null price and Paid to one-time cents", () => {
    expect(resolveEducationProduct({ model: "free", priceCents: 4900 })).toEqual({
      ok: true,
      is_flagship_free: true,
      price_cents: null,
    });
    expect(resolveEducationProduct({ model: "paid", priceCents: 4900 })).toEqual({
      ok: true,
      is_flagship_free: false,
      price_cents: 4900,
    });
    expect(resolveEducationProduct({ model: "paid", priceCents: null })).toEqual({ ok: false });
    expect(parseEducationPriceDollars("49")).toBe(4900);
    expect(parseEducationPriceDollars("49.50")).toBe(4950);
    expect(parseEducationPriceDollars("0")).toBeNull();
    expect(educationPriceInputValue(4900)).toBe("49.00");
    expect(formatEducationPriceCents(4950)).toBe("$49.50");
    expect(educationProductModel(true)).toBe("free");
    expect(educationProductModel(false)).toBe("paid");
    expect(educationCommercialLabel(true, null)).toBe("Free");
    expect(educationCommercialLabel(false, 4900)).toBe("Paid · $49.00");
  });
});
