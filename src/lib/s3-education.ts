import "server-only";

import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { CourseOutlineModule } from "@/lib/courses";
import {
  assertEducationBucketName,
  EDUCATION_AWS_ENV,
  EDUCATION_PUT_TTL_SECONDS,
  EDUCATION_S3_ENV,
  EDUCATION_SIGNED_URL_TTL_SECONDS,
  educationHlsPlaybackHref,
  educationPutLengthAllowed,
  isEducationObjectKey,
  isForbiddenEducationKey,
  lessonPlaybackReady,
  type EducationImageContentType,
  type EducationVideoContentType,
} from "@/lib/education";
import {
  isEducationCloudfrontConfigured,
  signEducationCloudfrontUrl,
} from "@/lib/education-cloudfront";

// Isolated 24frame-education S3 client. Never import @/lib/s3,
// @/lib/s3-social-media, @/lib/s3-finance, @/lib/s3-avatars, or
// @/lib/mediaconvert. Credentials are EDUCATION_AWS_* only.

function requireEducationAwsEnv(
  name: (typeof EDUCATION_AWS_ENV)[number] | (typeof EDUCATION_S3_ENV)[number],
): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

export function isEducationAwsConfigured(): boolean {
  return [...EDUCATION_AWS_ENV, ...EDUCATION_S3_ENV].every((name) => !!process.env[name]);
}

export function educationSourceBucket(): string {
  return assertEducationBucketName(
    process.env.S3_EDUCATION_SOURCE_BUCKET ?? "",
    "S3_EDUCATION_SOURCE_BUCKET",
  );
}

export function educationOutputBucket(): string {
  return assertEducationBucketName(
    process.env.S3_EDUCATION_OUTPUT_BUCKET ?? "",
    "S3_EDUCATION_OUTPUT_BUCKET",
  );
}

function educationClient(bucket: string): { bucket: string; s3: S3Client } {
  return {
    bucket,
    s3: new S3Client({
      region: requireEducationAwsEnv("EDUCATION_AWS_REGION"),
      credentials: {
        accessKeyId: requireEducationAwsEnv("EDUCATION_AWS_ACCESS_KEY_ID"),
        secretAccessKey: requireEducationAwsEnv("EDUCATION_AWS_SECRET_ACCESS_KEY"),
      },
      // Staff cover/source PUT server-side. WHEN_REQUIRED also keeps unused
      // presign helpers browser-safe (no default CRC32 SignedHeaders).
      requestChecksumCalculation: "WHEN_REQUIRED",
    }),
  };
}

function assertEducationKey(key: string): void {
  if (isForbiddenEducationKey(key) || !isEducationObjectKey(key)) {
    throw new Error("Education key is not allowed");
  }
}

export async function putEducationSourceObject(
  key: string,
  body: Uint8Array,
  contentType: EducationImageContentType | EducationVideoContentType,
): Promise<void> {
  assertEducationKey(key);
  const { bucket, s3 } = educationClient(educationSourceBucket());
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, max-age=300",
    }),
  );
}

export async function presignEducationSourcePut(
  key: string,
  contentType: EducationImageContentType | EducationVideoContentType,
  contentLength: number,
): Promise<string> {
  assertEducationKey(key);
  if (!educationPutLengthAllowed(key, contentType, contentLength)) {
    throw new Error("Education content length is not allowed");
  }
  const { bucket, s3 } = educationClient(educationSourceBucket());
  // Browser PUT sends Content-Type plus the Content-Length fetch adds for
  // the body. Sign that length so a declared size cannot PUT a larger
  // object. Do not sign Cache-Control — a signed extra header 403s the PUT.
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    { expiresIn: EDUCATION_PUT_TTL_SECONDS },
  );
}

export async function headEducationSourceObject(
  key: string,
): Promise<{ bytes: number; contentType: string | null } | null> {
  if (isForbiddenEducationKey(key) || !isEducationObjectKey(key)) return null;
  try {
    const { bucket, s3 } = educationClient(educationSourceBucket());
    const out = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    if (out.ContentLength == null || !Number.isFinite(out.ContentLength)) return null;
    const contentType = out.ContentType?.split(";")[0]?.trim().toLowerCase() || null;
    return { bytes: out.ContentLength, contentType };
  } catch {
    return null;
  }
}

export async function presignEducationSourceGet(key: string): Promise<string> {
  assertEducationKey(key);
  const { bucket, s3 } = educationClient(educationSourceBucket());
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: EDUCATION_SIGNED_URL_TTL_SECONDS,
  });
}

export async function presignEducationOutputGet(key: string): Promise<string> {
  assertEducationKey(key);
  const { bucket, s3 } = educationClient(educationOutputBucket());
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: EDUCATION_SIGNED_URL_TTL_SECONDS,
  });
}

export async function signedEducationCoverUrl(key: string): Promise<string | null> {
  if (isForbiddenEducationKey(key) || !isEducationObjectKey(key)) return null;
  try {
    if (!isEducationAwsConfigured()) return null;
    return await presignEducationSourceGet(key);
  } catch {
    return null;
  }
}

export async function signedEducationHlsUrl(key: string): Promise<string | null> {
  if (isForbiddenEducationKey(key) || !isEducationObjectKey(key)) return null;
  try {
    if (isEducationCloudfrontConfigured()) {
      return signEducationCloudfrontUrl(key);
    }
    if (!isEducationAwsConfigured()) return null;
    return await presignEducationOutputGet(key);
  } catch {
    return null;
  }
}

export async function signedEducationCoverUrls(
  courses: readonly { id: string; cover_key: string | null }[],
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    courses.map(async (course) => {
      if (!course.cover_key) return [course.id, null] as const;
      return [course.id, await signedEducationCoverUrl(course.cover_key)] as const;
    }),
  );
  return new Map(entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])));
}

// When Education CloudFront is configured, playbackUrl is the
// same-origin HLS proxy. That route sets lesson-scoped signed cookies
// (Domain = CF host, Path = /courses/{courseId}/lessons/{lessonId}/hls)
// and fetches children with those cookies. Preview (CF env empty)
// keeps the S3 presigned master — relative children stay unauthorized.
export async function attachEducationLessonPlayback(
  modules: CourseOutlineModule[],
): Promise<CourseOutlineModule[]> {
  const cloudfront = isEducationCloudfrontConfigured();
  return Promise.all(
    modules.map(async (courseModule) => ({
      ...courseModule,
      lessons: await Promise.all(
        courseModule.lessons.map(async (lesson) => ({
          ...lesson,
          playbackUrl: lessonPlaybackReady(lesson)
            ? cloudfront
              ? educationHlsPlaybackHref(courseModule.course_id, lesson.id)
              : await signedEducationHlsUrl(lesson.hls_key ?? "")
            : null,
        })),
      ),
    })),
  );
}
