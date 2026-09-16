import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { EDUCATION_ADMIN, EDUCATION_HREF } from "./education";
import { EDUCATION_MANAGE_NAV, EDUCATION_NAV, GC_NAV } from "./nav";

const migration = readFileSync("supabase/migrations/20260916010000_course_education_media.sql", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const infra = readFileSync("docs/infra/education-aws-setup.md", "utf8");

describe("education isolation", () => {
  it("documents proposed names and forbids creating AWS resources in-repo", () => {
    expect(infra).toContain("405912452061");
    expect(infra).toContain("us-west-2");
    expect(infra).toContain("24frame-education-source-prod");
    expect(infra).toContain("24frame-education-output-prod");
    expect(infra).toContain("Do **not** create these buckets");
    expect(infra).toContain("Cover bytes PUT **server-side**");
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

  it("puts staff Course management on Education workspace, not GC_NAV or member browse", () => {
    expect(EDUCATION_HREF).toBe("/education");
    expect(EDUCATION_MANAGE_NAV.map((item) => item.href)).toEqual([EDUCATION_HREF]);
    expect(EDUCATION_MANAGE_NAV.map((item) => item.label)).toEqual([EDUCATION_ADMIN.manage]);
    expect(GC_NAV.map((item) => item.href)).not.toContain(EDUCATION_HREF);
    expect(GC_NAV.map((item) => item.href)).not.toContain("/gc/education");
    expect(EDUCATION_NAV.map((item) => item.href)).toEqual(["/social/courses"]);
    expect(EDUCATION_NAV.map((item) => item.href)).not.toContain(EDUCATION_HREF);
    expect(existsSync("src/app/(app)/(operator)/education/page.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/(operator)/education/[slug]/page.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/(operator)/gc/education/page.tsx")).toBe(false);
    expect(existsSync("src/app/(app)/education/page.tsx")).toBe(false);
    expect(existsSync("src/app/(app)/social/courses/new/page.tsx")).toBe(false);
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(nextConfig).toContain('source: "/gc/education"');
    expect(nextConfig).toContain('destination: "/education"');
    expect(nextConfig).toContain('source: "/gc/education/:slug"');
    expect(nextConfig).toContain('destination: "/education/:slug"');
    expect(nextConfig).toContain("permanent: true");
  });

  it("keeps Education copy off SaaS and buy language", () => {
    const blob = JSON.stringify(EDUCATION_ADMIN);
    expect(blob).not.toMatch(/seamless|frictionless|upload and earn|MasterClass|buy|Stripe|Apple Pay|Klarna/i);
    expect(EDUCATION_ADMIN.title).toBe("Education");
    expect(EDUCATION_ADMIN.manage).toBe("Course management");
    expect(EDUCATION_ADMIN.free).toBe("Free");
    expect(EDUCATION_ADMIN.paid).toBe("Paid");
  });

  it("keeps product setup on staff admin and does not add a member checkout", () => {
    const forms = readFileSync("src/app/(app)/(operator)/education/education-forms.tsx", "utf8");
    const actions = readFileSync("src/app/(app)/(operator)/education/actions.ts", "utf8");
    const consume = readFileSync("src/components/courses/course-consume.tsx", "utf8");
    const list = readFileSync("src/app/(app)/social/courses/page.tsx", "utf8");
    expect(forms).toContain("data-education-product");
    expect(forms).toContain("freePreview");
    expect(actions).toContain("price_cents");
    expect(actions).toContain("is_flagship_free");
    expect(actions).not.toMatch(/stripe|checkout|Apple Pay|Klarna/i);
    expect(forms).not.toMatch(/stripe|checkout|Apple Pay|Klarna/i);
    expect(consume).not.toMatch(/Buy|checkout|Stripe/i);
    expect(list).not.toMatch(/Buy|checkout|Stripe/i);
  });

  it("does not let Education clients import other storage lanes", () => {
    const s3 = readFileSync("src/lib/s3-education.ts", "utf8");
    const mc = readFileSync("src/lib/education-mediaconvert.ts", "utf8");
    const actions = readFileSync("src/app/(app)/(operator)/education/actions.ts", "utf8");
    expect(s3).not.toContain('from "@/lib/s3"');
    expect(s3).not.toContain('from "@/lib/s3-social-media"');
    expect(mc).not.toContain('from "@/lib/mediaconvert"');
    expect(actions).toContain("createAdminClient");
    expect(actions).toContain("gc_staff");
    expect(actions).not.toContain('from "@/lib/s3"');
    expect(actions).not.toContain('from "@/lib/s3-social-media"');
  });

  it("uploads covers server-side so Saving… can clear without a browser S3 PUT", () => {
    const forms = readFileSync("src/app/(app)/(operator)/education/education-forms.tsx", "utf8");
    const actions = readFileSync("src/app/(app)/(operator)/education/actions.ts", "utf8");
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(forms).toContain("uploadEducationCover");
    expect(forms).toContain("finally");
    expect(forms).not.toMatch(/presignEducationUpload\(\{\s*kind:\s*"cover"/);
    expect(actions).toContain("putEducationSourceObject");
    expect(actions).toContain("cover_key");
    expect(nextConfig).toContain('bodySizeLimit: "11mb"');
  });
});
