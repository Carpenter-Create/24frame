import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/education-cloudfront", () => ({
  isEducationCloudfrontConfigured: vi.fn(() => true),
  signEducationCloudfrontCookies: vi.fn(),
  educationCloudfrontCookieHeader: vi.fn(
    () => "CloudFront-Policy=policy-a; CloudFront-Signature=sig-a; CloudFront-Key-Pair-Id=KEDU",
  ),
  educationCloudfrontCookieSetOptions: vi.fn(() => ({
    domain: "d-education.cloudfront.net",
    path: "/courses/06655c31-1111-4111-8111-111111111111/lessons/9c525955-2222-4222-8222-222222222222/hls",
    secure: true,
    httpOnly: true,
    sameSite: "none" as const,
    maxAge: 300,
  })),
  educationCloudfrontObjectUrl: vi.fn(
    (key: string) => `https://d-education.cloudfront.net/${key}`,
  ),
}));

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  educationCloudfrontCookieSetOptions,
  educationCloudfrontObjectUrl,
  isEducationCloudfrontConfigured,
  signEducationCloudfrontCookies,
} from "@/lib/education-cloudfront";
import { GET } from "./route";

const COURSE = "06655c31-1111-4111-8111-111111111111";
const LESSON = "9c525955-2222-4222-8222-222222222222";
const OTHER_LESSON = "aaaaaaaa-3333-4333-8333-333333333333";
const UID = "11111111-1111-4111-8111-111111111111";

function params(asset: string[], courseId = COURSE, lessonId = LESSON) {
  return { params: Promise.resolve({ courseId, lessonId, asset }) };
}

function readyLesson(courseId = COURSE) {
  return {
    id: LESSON,
    encode_status: "complete",
    hls_key: `courses/${courseId}/lessons/${LESSON}/hls/source.m3u8`,
    modules: { course_id: courseId },
  };
}

function stubClient(lesson: unknown) {
  const maybeSingle = vi.fn(async () => ({ data: lesson, error: null }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from, select, eq };
}

describe("GET /api/education/hls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isEducationCloudfrontConfigured).mockReturnValue(true);
    vi.mocked(signEducationCloudfrontCookies).mockReturnValue({
      "CloudFront-Policy": "policy-a",
      "CloudFront-Signature": "sig-a",
      "CloudFront-Key-Pair-Id": "KEDU",
    });
    fetchMock.mockResolvedValue(
      new Response("#EXTM3U\n", {
        status: 200,
        headers: { "Content-Type": "application/vnd.apple.mpegurl" },
      }),
    );
  });

  it("is 401 without a session and does not sign or fetch", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await GET(new Request("http://test/master"), params(["source.m3u8"]));
    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(signEducationCloudfrontCookies).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is 404 for a traversal asset and does not sign", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: UID, email: "ada@example.com" });
    const res = await GET(new Request("http://test/evil"), params(["..", "secret.ts"]));
    expect(res.status).toBe(404);
    expect(createClient).not.toHaveBeenCalled();
    expect(signEducationCloudfrontCookies).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is 404 when the lesson is not ready or belongs to another course", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: UID, email: "ada@example.com" });
    stubClient({ ...readyLesson(), modules: { course_id: OTHER_LESSON } });
    const wrongCourse = await GET(new Request("http://test/wrong"), params(["source.m3u8"]));
    expect(wrongCourse.status).toBe(404);

    stubClient({ ...readyLesson(), encode_status: "running" });
    const notReady = await GET(new Request("http://test/running"), params(["source.m3u8"]));
    expect(notReady.status).toBe(404);
    expect(signEducationCloudfrontCookies).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches the unsigned CF object with lesson-scoped cookies and sets them on the response", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: UID, email: "ada@example.com" });
    stubClient(readyLesson());

    const res = await GET(new Request("http://test/master"), params(["source.m3u8"]));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("#EXTM3U\n");
    expect(signEducationCloudfrontCookies).toHaveBeenCalledWith(COURSE, LESSON);
    expect(educationCloudfrontObjectUrl).toHaveBeenCalledWith(
      `courses/${COURSE}/lessons/${LESSON}/hls/source.m3u8`,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `https://d-education.cloudfront.net/courses/${COURSE}/lessons/${LESSON}/hls/source.m3u8`,
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const sent = fetchMock.mock.calls[0]?.[1] as { headers: Headers };
    expect(sent.headers.get("Cookie")).toContain("CloudFront-Policy=policy-a");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");

    const setCookies = res.headers.getSetCookie();
    expect(setCookies.some((row) => row.startsWith("CloudFront-Policy="))).toBe(true);
    expect(setCookies.some((row) => row.includes("Domain=d-education.cloudfront.net"))).toBe(true);
    expect(
      setCookies.some((row) =>
        row.includes(`Path=/courses/${COURSE}/lessons/${LESSON}/hls`),
      ),
    ).toBe(true);
    expect(educationCloudfrontCookieSetOptions).toHaveBeenCalledWith(COURSE, LESSON);
  });

  it("authorizes a relative child playlist under the same lesson prefix", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: UID, email: "ada@example.com" });
    stubClient(readyLesson());

    const res = await GET(new Request("http://test/child"), params(["source_hls.m3u8"]));
    expect(res.status).toBe(200);
    expect(educationCloudfrontObjectUrl).toHaveBeenCalledWith(
      `courses/${COURSE}/lessons/${LESSON}/hls/source_hls.m3u8`,
    );
    expect(signEducationCloudfrontCookies).toHaveBeenCalledWith(COURSE, LESSON);
  });

  it("stays on Preview S3 when Education CF env is empty", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: UID, email: "ada@example.com" });
    vi.mocked(isEducationCloudfrontConfigured).mockReturnValue(false);
    stubClient(readyLesson());
    const res = await GET(new Request("http://test/preview"), params(["source.m3u8"]));
    expect(res.status).toBe(404);
    expect(signEducationCloudfrontCookies).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never imports title, media, or finance CloudFront lanes", () => {
    const src = readFileSync(
      "src/app/api/education/hls/[courseId]/[lessonId]/[...asset]/route.ts",
      "utf8",
    );
    expect(src).toContain("signEducationCloudfrontCookies");
    expect(src).not.toContain('from "@/lib/cloudfront"');
    expect(src).not.toContain('from "@/lib/social-media-cloudfront"');
    expect(src).not.toContain('from "@/lib/finance-cloudfront"');
    expect(src).not.toContain('from "@/lib/s3"');
    expect(src).not.toContain("process.env.CLOUDFRONT_");
    expect(src).not.toContain("process.env.MEDIA_CLOUDFRONT_");
    expect(src).not.toContain("process.env.FINANCE_CLOUDFRONT_");
  });
});
