import { NextResponse } from "next/server";

import {
  educationHlsAssetKey,
  educationHlsContentType,
  educationHlsPrefix,
  lessonPlaybackReady,
} from "@/lib/education";
import {
  educationCloudfrontCookieHeader,
  educationCloudfrontCookieSetOptions,
  educationCloudfrontObjectUrl,
  isEducationCloudfrontConfigured,
  signEducationCloudfrontCookies,
  type EducationCloudfrontSignedCookies,
} from "@/lib/education-cloudfront";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function moduleCourseId(value: unknown): string | null {
  if (Array.isArray(value)) return moduleCourseId(value[0]);
  if (value && typeof value === "object" && "course_id" in value) {
    const courseId = (value as { course_id?: unknown }).course_id;
    return typeof courseId === "string" ? courseId : null;
  }
  return null;
}

function applyEducationCloudfrontCookies(
  response: NextResponse,
  cookies: EducationCloudfrontSignedCookies,
  courseId: string,
  lessonId: string,
): void {
  const options = educationCloudfrontCookieSetOptions(courseId, lessonId);
  response.cookies.set("CloudFront-Policy", cookies["CloudFront-Policy"], options);
  response.cookies.set("CloudFront-Signature", cookies["CloudFront-Signature"], options);
  response.cookies.set("CloudFront-Key-Pair-Id", cookies["CloudFront-Key-Pair-Id"], options);
}

function privateStatus(status: number, extra?: HeadersInit): NextResponse {
  return new NextResponse(null, {
    status,
    headers: { "Cache-Control": "private, no-store", ...extra },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ courseId: string; lessonId: string; asset: string[] }> },
) {
  const user = await getAuthUser();
  if (!user) return privateStatus(401);

  const { courseId, lessonId, asset } = await context.params;
  const assetPath = asset.join("/");
  const key = educationHlsAssetKey(courseId, lessonId, assetPath);
  if (!key) return privateStatus(404);

  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, encode_status, hls_key, modules!inner(course_id)")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || moduleCourseId(lesson.modules) !== courseId || !lessonPlaybackReady(lesson)) {
    return privateStatus(404);
  }

  const prefix = educationHlsPrefix(courseId, lessonId);
  if (lesson.hls_key && !lesson.hls_key.startsWith(prefix)) {
    return privateStatus(404);
  }

  if (!isEducationCloudfrontConfigured()) {
    return privateStatus(404);
  }

  try {
    const cookies = signEducationCloudfrontCookies(courseId, lessonId);
    const headers = new Headers({
      Cookie: educationCloudfrontCookieHeader(cookies),
    });
    const range = request.headers.get("Range");
    if (range) headers.set("Range", range);

    const upstream = await fetch(educationCloudfrontObjectUrl(key), {
      headers,
      redirect: "manual",
    });

    const contentType =
      upstream.headers.get("Content-Type") ?? educationHlsContentType(assetPath);
    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
    const contentRange = upstream.headers.get("Content-Range");
    if (contentRange) response.headers.set("Content-Range", contentRange);
    const acceptRanges = upstream.headers.get("Accept-Ranges");
    if (acceptRanges) response.headers.set("Accept-Ranges", acceptRanges);
    const contentLength = upstream.headers.get("Content-Length");
    if (contentLength) response.headers.set("Content-Length", contentLength);
    applyEducationCloudfrontCookies(response, cookies, courseId, lessonId);
    return response;
  } catch {
    return privateStatus(502);
  }
}
