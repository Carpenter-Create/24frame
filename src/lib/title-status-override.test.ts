import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { POST_APPROVAL_TITLE_STATUSES } from "@/lib/assets";
import { TITLE_STATUS_LABELS, type TitleStatus } from "@/lib/titles";
import {
  APPROVED_TITLE_STATUSES,
  DELIVERED_ENDPOINT_STATUSES,
  TITLE_STATUS_OVERRIDE,
  TITLE_STATUS_OVERRIDE_VALUES,
  isApprovedTitleStatus,
  isDeliveredEndpointStatus,
  titleHasDeliveredEndpoint,
  titleStatusOverrideConfirmBody,
  titleStatusOverrideLocked,
  titleStatusOverrideNotifyCopy,
  titleStatusOverrideOptionLabel,
  titleStatusOverrideShouldNotify,
} from "./title-status-override";

const ALL_STATUSES = Object.keys(TITLE_STATUS_LABELS) as TitleStatus[];

describe("titleStatusOverrideLocked", () => {
  it("locks only Approved ∧ (delivered endpoint ∨ reporting)", () => {
    expect(
      titleStatusOverrideLocked({
        status: "in_delivery",
        hasDeliveredEndpoint: true,
        hasReportingActivity: false,
      }),
    ).toBe(true);
    expect(
      titleStatusOverrideLocked({
        status: "live",
        hasDeliveredEndpoint: false,
        hasReportingActivity: true,
      }),
    ).toBe(true);
    expect(
      titleStatusOverrideLocked({
        status: "in_delivery",
        hasDeliveredEndpoint: false,
        hasReportingActivity: false,
      }),
    ).toBe(false);
    expect(
      titleStatusOverrideLocked({
        status: "draft",
        hasDeliveredEndpoint: true,
        hasReportingActivity: true,
      }),
    ).toBe(false);
  });

  it("does not treat takedown or archived as Approved for lock-in", () => {
    for (const status of ["takedown_requested", "taken_down", "archived", "in_review", "submitted"]) {
      expect(
        titleStatusOverrideLocked({
          status,
          hasDeliveredEndpoint: true,
          hasReportingActivity: true,
        }),
      ).toBe(false);
    }
    expect([...APPROVED_TITLE_STATUSES]).toEqual(["in_delivery", "live"]);
    expect(isApprovedTitleStatus("in_delivery")).toBe(true);
    expect(isApprovedTitleStatus("taken_down")).toBe(false);
    expect(POST_APPROVAL_TITLE_STATUSES).toContain("taken_down");
    expect((APPROVED_TITLE_STATUSES as readonly string[]).includes("taken_down")).toBe(false);
  });
});

describe("delivered endpoint SoT", () => {
  it("counts delivered and live only — pending is not delivered-to", () => {
    expect([...DELIVERED_ENDPOINT_STATUSES]).toEqual(["delivered", "live"]);
    expect(isDeliveredEndpointStatus("pending")).toBe(false);
    expect(isDeliveredEndpointStatus("rejected")).toBe(false);
    expect(isDeliveredEndpointStatus("taken_down")).toBe(false);
    expect(titleHasDeliveredEndpoint([{ status: "pending" }])).toBe(false);
    expect(titleHasDeliveredEndpoint([{ status: "delivered" }])).toBe(true);
    expect(titleHasDeliveredEndpoint([{ status: "live" }])).toBe(true);
  });
});

describe("title status override copy + notify", () => {
  it("covers the live DB enum and keeps copy out of scare language", () => {
    expect(TITLE_STATUS_OVERRIDE_VALUES).toEqual(ALL_STATUSES);
    expect(titleStatusOverrideOptionLabel("in_delivery")).toBe("Approved · ready to deliver");
    expect(titleStatusOverrideConfirmBody("Harbor Cut", "draft")).toBe(
      "“Harbor Cut” will move to Draft.",
    );
    expect(TITLE_STATUS_OVERRIDE.locked).toContain("Archive");
    expect(TITLE_STATUS_OVERRIDE.locked).not.toMatch(/cannot be undone|permanent|warning/i);
    expect(TITLE_STATUS_OVERRIDE.reasonRequired).toBe("A reason is required to set title status.");
  });

  it("notifies only when landing in draft or in_review", () => {
    expect(titleStatusOverrideShouldNotify("draft")).toBe(true);
    expect(titleStatusOverrideShouldNotify("in_review")).toBe(true);
    expect(titleStatusOverrideShouldNotify("in_delivery")).toBe(false);
    expect(titleStatusOverrideNotifyCopy("live", "Harbor Cut", "ready", "t1")).toBeNull();
    expect(titleStatusOverrideNotifyCopy("draft", "Harbor Cut", "needs stills", "t1")).toEqual({
      kind: "title_rejected",
      title: "Title returned for amendment",
      body: '"Harbor Cut" was returned for amendment: needs stills',
      subject: '"Harbor Cut" was returned for amendment',
      cta: "Review and resubmit",
      path: "/aggregation/titles/t1",
    });
    expect(titleStatusOverrideNotifyCopy("in_review", "Harbor Cut", "recheck chain", "t1")).toEqual({
      kind: "title_rejected",
      title: "Title needs review",
      body: '"Harbor Cut" needs review: recheck chain',
      subject: '"Harbor Cut" needs review',
      cta: "Review and resubmit",
      path: "/aggregation/titles/t1",
    });
  });
});

describe("G6 Avails stay Approved-derived", () => {
  it("does not invent a second Avails rule in the override helper or Avails page", () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const helper = readFileSync(join(dir, "title-status-override.ts"), "utf8");
    const availsPage = readFileSync(
      join(dir, "../app/(app)/(operator)/staff/avails/page.tsx"),
      "utf8",
    );
    expect(helper).not.toContain("/avails");
    expect(helper).not.toContain("AVAILS");
    expect(availsPage).toContain('eq("status", "live")');
    expect(availsPage).not.toContain("gc_set_title_status");
    expect(availsPage).not.toContain("titleStatusOverrideLocked");
  });
});
