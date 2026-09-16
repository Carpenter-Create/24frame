import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { EDUCATION_ADMIN, EDUCATION_HREF } from "./education";
import { EDUCATION_NAV, GC_NAV } from "./nav";

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

  it("puts staff Education on GC_NAV and keeps the member rail on Route A", () => {
    expect(GC_NAV.map((item) => item.href)).toContain(EDUCATION_HREF);
    expect(EDUCATION_NAV.map((item) => item.href)).toEqual(["/social/courses"]);
    expect(EDUCATION_NAV.map((item) => item.href)).not.toContain(EDUCATION_HREF);
    expect(existsSync("src/app/(app)/(operator)/gc/education/page.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/education/page.tsx")).toBe(false);
    expect(existsSync("src/app/(app)/social/courses/new/page.tsx")).toBe(false);
  });

  it("keeps Education copy off SaaS and buy language", () => {
    const blob = JSON.stringify(EDUCATION_ADMIN);
    expect(blob).not.toMatch(/seamless|frictionless|upload and earn|MasterClass|buy/i);
    expect(EDUCATION_ADMIN.title).toBe("Education");
  });

  it("does not let Education clients import other storage lanes", () => {
    const s3 = readFileSync("src/lib/s3-education.ts", "utf8");
    const mc = readFileSync("src/lib/education-mediaconvert.ts", "utf8");
    const actions = readFileSync("src/app/(app)/(operator)/gc/education/actions.ts", "utf8");
    expect(s3).not.toContain('from "@/lib/s3"');
    expect(s3).not.toContain('from "@/lib/s3-social-media"');
    expect(mc).not.toContain('from "@/lib/mediaconvert"');
    expect(actions).toContain("createAdminClient");
    expect(actions).toContain("gc_staff");
    expect(actions).not.toContain('from "@/lib/s3"');
    expect(actions).not.toContain('from "@/lib/s3-social-media"');
  });
});
