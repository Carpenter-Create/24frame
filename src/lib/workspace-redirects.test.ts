import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { EDUCATION_HREF, EDUCATION_MANAGE_HREF } from "./education";
import { DASHBOARD_HREF } from "./dashboard-admin";
import { REPORTS_HREF } from "./reports";
import { ACTIVITY_HREF } from "./activity";
import { ATTENTION_HREF } from "./findings";
import { TITLES_HREF } from "./title-public-id";
import { QUEUE_HREF } from "./queue";
import { AVAILS_HREF } from "./avails";
import { CHANNELS_HREF } from "./channel-card";
import { GC_DELIVERIES_HREF } from "./gc-deliveries";
import { NEWS_HREF } from "./news";
import { WORKSPACE_REDIRECTS } from "./workspace-redirects";
import { aggregationPath, workspaceHome } from "./workspace";

function dest(source: string): string | undefined {
  return WORKSPACE_REDIRECTS.find((row) => row.source === source)?.destination;
}

describe("workspace URL IA redirects", () => {
  it("permanently maps every leftover first-segment Aggregation path", () => {
    expect(workspaceHome("aggregation")).toBe(DASHBOARD_HREF);
    expect(DASHBOARD_HREF).toBe("/aggregation/dashboard");
    expect(dest("/")).toBe(DASHBOARD_HREF);
    expect(dest("/aggregation")).toBe(DASHBOARD_HREF);
    expect(dest("/dashboard")).toBe(DASHBOARD_HREF);
    expect(dest("/titles")).toBe(TITLES_HREF);
    expect(dest("/attention")).toBe(ATTENTION_HREF);
    expect(dest("/activity")).toBe(ACTIVITY_HREF);
    expect(dest("/reports")).toBe(REPORTS_HREF);
    expect(dest("/messages")).toBe(aggregationPath("messages"));
    expect(dest("/queue")).toBe(QUEUE_HREF);
    expect(dest("/avails")).toBe(AVAILS_HREF);
    expect(dest("/channels")).toBe(CHANNELS_HREF);
    expect(dest("/analytics")).toBe(REPORTS_HREF);
    expect(dest("/earn")).toBe(REPORTS_HREF);
    expect(dest("/finance")).toBe(REPORTS_HREF);
    expect(dest("/catalog-health")).toBe(ATTENTION_HREF);
    expect(dest("/deliveries")).toBe(TITLES_HREF);
    expect(dest("/vendors")).toBe(CHANNELS_HREF);
    expect(dest("/overview")).toBe("/home");
    expect(dest("/news")).toBe(NEWS_HREF);
    expect(dest("/gc/:path*")).toBe("/aggregation/gc/:path*");
    expect(WORKSPACE_REDIRECTS.every((row) => row.permanent)).toBe(true);
  });

  it("moves member Education off Social and keeps staff CMS under /education/manage", () => {
    expect(workspaceHome("education")).toBe(EDUCATION_HREF);
    expect(EDUCATION_HREF).toBe("/education");
    expect(EDUCATION_MANAGE_HREF).toBe("/education/manage");
    expect(dest("/social/courses")).toBe(EDUCATION_HREF);
    expect(dest("/social/courses/:path*")).toBe("/education/:path*");
    expect(dest("/gc/education")).toBe(EDUCATION_MANAGE_HREF);
    expect(dest("/gc/education/:slug")).toBe("/education/manage/:slug");
    expect(dest("/home")).toBeUndefined();
    expect(dest("/home/news")).toBeUndefined();
    expect(dest("/social")).toBeUndefined();
  });

  it("is the next.config redirects SoT", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).toContain("WORKSPACE_REDIRECTS");
    expect(config).toContain("return [...WORKSPACE_REDIRECTS]");
    expect(config).not.toContain('destination: "/dashboard"');
    expect(config).not.toContain('destination: "/reports"');
  });
});
