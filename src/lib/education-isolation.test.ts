import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { EDUCATION_ADMIN, EDUCATION_HREF, EDUCATION_MANAGE_HREF } from "./education";
import { WORKSPACE_REDIRECTS } from "./workspace-redirects";
import { EDUCATION_MANAGE_NAV, EDUCATION_NAV, GC_NAV } from "./nav";

const mediaMigration = readFileSync(
  "supabase/migrations/20260916010000_course_education_media.sql",
  "utf8",
);
const catalogMigration = readFileSync(
  "supabase/migrations/20260916020000_education_catalog.sql",
  "utf8",
);
const migration = mediaMigration;
const envExample = readFileSync(".env.example", "utf8");
const infra = readFileSync("docs/infra/education-aws-setup.md", "utf8");

describe("education isolation", () => {
  it("documents proposed names and forbids creating AWS resources in-repo", () => {
    expect(infra).toContain("405912452061");
    expect(infra).toContain("us-west-2");
    expect(infra).toContain("24frame-education-source-prod");
    expect(infra).toContain("24frame-education-output-prod");
    expect(infra).toContain("Do **not** create these buckets");
    expect(infra).toContain("Cover and lesson source bytes PUT **server-side**");
    expect(infra).toContain("courses/{courseId}/lessons/{lessonId}/hls/*");
    expect(infra).toContain("/api/education/hls/");
    expect(infra).toContain("EDUCATION_AWS_ACCESS_KEY_ID");
    expect(envExample).toContain("EDUCATION_AWS_ACCESS_KEY_ID=");
    expect(envExample).toContain("S3_EDUCATION_SOURCE_BUCKET=");
    expect(envExample).toContain("S3_EDUCATION_OUTPUT_BUCKET=");
    expect(envExample).toContain("Never fall back to AWS_* / FINANCE_AWS_* / MEDIA_AWS_* / SES_AWS_*");
  });

  it("keeps Mapping C and ADAM LOCK on the media migration", () => {
    expect(migration).toContain("ADAM LOCK");
    expect(migration).toContain("do not wire is_gc_staff");
    expect(migration).toContain("cover_key");
    expect(migration).toContain("source_key");
    expect(migration).toContain("hls_key");
    expect(migration).toContain("encode_status");
    expect(migration).not.toContain("create policy");
    expect(migration).not.toMatch(/is_gc_staff\(/);
  });

  it("puts staff Manage courses on Education workspace, not GC_NAV or member browse", () => {
    expect(EDUCATION_HREF).toBe("/education");
    expect(EDUCATION_MANAGE_HREF).toBe("/education/manage");
    expect(EDUCATION_MANAGE_NAV.map((item) => item.href)).toEqual([EDUCATION_MANAGE_HREF]);
    expect(EDUCATION_MANAGE_NAV.map((item) => item.label)).toEqual([EDUCATION_ADMIN.manage]);
    expect(GC_NAV.map((item) => item.href)).not.toContain(EDUCATION_HREF);
    expect(GC_NAV.map((item) => item.href)).not.toContain("/gc/education");
    expect(EDUCATION_NAV.map((item) => item.href)).toEqual([EDUCATION_HREF]);
    expect(EDUCATION_NAV.map((item) => item.href)).not.toContain("/social/courses");
    expect(existsSync("src/app/(app)/(operator)/education/manage/page.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/(operator)/education/manage/[slug]/page.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/(operator)/aggregation/gc/education/page.tsx")).toBe(false);
    expect(existsSync("src/app/(app)/education/page.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/education/new/page.tsx")).toBe(false);
    expect(WORKSPACE_REDIRECTS.some((row) => row.source === "/gc/education" && row.destination === EDUCATION_MANAGE_HREF)).toBe(true);
    expect(WORKSPACE_REDIRECTS.some((row) => row.source === "/social/courses" && row.destination === EDUCATION_HREF)).toBe(true);
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(nextConfig).toContain("WORKSPACE_REDIRECTS");
    expect(nextConfig).toContain("permanent");
  });

  it("keeps Education copy off SaaS and buy language", () => {
    const blob = JSON.stringify(EDUCATION_ADMIN);
    expect(blob).not.toMatch(/seamless|frictionless|upload and earn|MasterClass|buy|Stripe|Apple Pay|Klarna/i);
    expect(EDUCATION_ADMIN.title).toBe("Manage courses");
    expect(EDUCATION_ADMIN.manage).toBe("Manage courses");
    expect(EDUCATION_ADMIN.free).toBe("Free");
    expect(EDUCATION_ADMIN.paid).toBe("Paid");
    expect(blob).not.toContain("Welcome");
    expect(blob).not.toContain("New & For You");
    const rail = readFileSync("src/app/(app)/(operator)/education/manage/education-course-rail.tsx", "utf8");
    expect(rail).toContain("NewCourseButton");
    expect(rail).toContain("data-education-course-name");
    expect(rail).not.toMatch(/Welcome|New & For You|\bHome\b/);
    expect(rail).not.toContain("data-education-home");
  });

  it("keeps product setup on staff admin and does not add a member checkout", () => {
    const forms = readFileSync("src/app/(app)/(operator)/education/manage/education-forms.tsx", "utf8");
    const actions = readFileSync("src/app/(app)/(operator)/education/manage/actions.ts", "utf8");
    const consume = readFileSync("src/components/courses/course-consume.tsx", "utf8");
    const list = readFileSync("src/app/(app)/education/page.tsx", "utf8");
    expect(forms).toContain("data-education-product");
    expect(forms).toContain("data-education-cover-dropzone");
    expect(forms).toContain('data-education-lesson-type="lesson"');
    expect(forms).toContain("EDUCATION_NAME_MAX");
    expect(forms).toContain("EDUCATION_SUMMARY_MAX");
    expect(forms).toContain("educationCharCount");
    expect(forms).toContain("durationMinutes");
    expect(forms).toContain("EDUCATION_ADMIN.addLesson");
    expect(forms).not.toContain("freePreview");
    expect(forms).not.toMatch(/Sequence|free.?taste|free.?preview/i);
    expect(forms).not.toMatch(/#e91e63|#d500f9|#ff00ff|magenta|passion/i);
    expect(actions).toContain("price_cents");
    expect(actions).toContain("is_flagship_free");
    expect(actions).not.toContain("freePreview");
    expect(actions).not.toMatch(/stripe|checkout|Apple Pay|Klarna/i);
    expect(forms).not.toMatch(/stripe|checkout|Apple Pay|Klarna/i);
    expect(consume).not.toMatch(/Buy|checkout|Stripe/i);
    expect(consume).toContain("data-course-playlist");
    expect(consume).toContain("lg:flex-row");
    expect(list).not.toMatch(/Buy|checkout|Stripe/i);
    expect(list).not.toContain("Welcome");
    expect(list).not.toContain("New & For You");
    expect(list).not.toContain("Manage courses");
  });

  it("does not let Education clients import other storage lanes", () => {
    const s3 = readFileSync("src/lib/s3-education.ts", "utf8");
    const mc = readFileSync("src/lib/education-mediaconvert.ts", "utf8");
    const actions = readFileSync("src/app/(app)/(operator)/education/manage/actions.ts", "utf8");
    expect(s3).not.toContain('from "@/lib/s3"');
    expect(s3).not.toContain('from "@/lib/s3-social-media"');
    expect(mc).not.toContain('from "@/lib/mediaconvert"');
    expect(actions).toContain("createAdminClient");
    expect(actions).toContain("gc_staff");
    expect(readFileSync("src/lib/education-admin.ts", "utf8")).toContain("encode_error");
    expect(readFileSync("src/app/(app)/(operator)/education/manage/[slug]/page.tsx", "utf8")).toContain(
      "canStartEducationEncode",
    );
    expect(actions).not.toContain('from "@/lib/s3"');
    expect(actions).not.toContain('from "@/lib/s3-social-media"');
    const hls = readFileSync(
      "src/app/api/education/hls/[courseId]/[lessonId]/[...asset]/route.ts",
      "utf8",
    );
    expect(hls).toContain("signEducationCloudfrontCookies");
    expect(hls).not.toContain('from "@/lib/cloudfront"');
    expect(hls).not.toContain('from "@/lib/s3"');
    expect(hls).not.toContain("process.env.CLOUDFRONT_");
    expect(hls).not.toContain("process.env.MEDIA_CLOUDFRONT_");
    expect(hls).not.toContain("process.env.FINANCE_CLOUDFRONT_");
  });

  it("uploads covers and lesson sources server-side so Saving… can clear without a browser S3 PUT", () => {
    const forms = readFileSync("src/app/(app)/(operator)/education/manage/education-forms.tsx", "utf8");
    const actions = readFileSync("src/app/(app)/(operator)/education/manage/actions.ts", "utf8");
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(forms).toContain("uploadEducationCover");
    expect(forms).toContain("uploadEducationLessonSource");
    expect(forms).toContain("finally");
    expect(forms).not.toMatch(/presignEducationUpload/);
    expect(forms).not.toContain("putEducationBrowserObject");
    expect(actions).toContain("putEducationSourceObject");
    expect(actions).toContain("cover_key");
    expect(actions).toContain("source_key");
    expect(nextConfig).toContain('bodySizeLimit: "3gb"');
  });

  it("locks catalog_code, instructors, and education_videos off media_assets and is_gc_staff", () => {
    expect(catalogMigration).toContain("ADAM LOCK A");
    expect(catalogMigration).toContain("catalog_code");
    expect(catalogMigration).toContain("EDU-");
    expect(catalogMigration).toContain("create table if not exists public.instructors");
    expect(catalogMigration).toContain("create table if not exists public.education_videos");
    expect(catalogMigration).toContain("do not wire is_gc_staff");
    expect(catalogMigration).not.toMatch(/is_gc_staff\(/);
    expect(catalogMigration).not.toMatch(/create table if not exists public\.media_assets/);
    expect(catalogMigration).not.toMatch(/S3_MEDIA_|24frame-media-source/);
    expect(catalogMigration).toContain("create policy courses_select");
    expect(catalogMigration).toContain("status = 'published'");
  });
});
