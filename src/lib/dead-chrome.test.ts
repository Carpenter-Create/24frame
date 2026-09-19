import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

// P1-5 / P1-6 / P1-7 — dead chrome and unused presentation.
// SoT: AppShell + HouseLeadChrome; Activity inbox; finance lib +
// reports/glance. Keep MessageLink, buildClientFinanceDashboard,
// HouseAiMark, setActiveOrg.

const DELETED = [
  "src/components/social/social-top-bar.tsx",
  "src/components/chrome/house-phone-top-chrome.tsx",
  "src/components/chrome/organization-switcher.tsx",
  "src/components/messages/notification-inbox.tsx",
  "src/app/(app)/aggregation/messages/mark-all-read.tsx",
  "src/app/(app)/aggregation/messages/mark-read.tsx",
  "src/components/dashboard/catalog-activity-hero.tsx",
  "src/components/dashboard/stat-tile.tsx",
  "src/components/finance/client-finance-dashboard.tsx",
  "src/components/social/social-first-win.tsx",
  "src/components/social/social-lenses.tsx",
] as const;

const KEPT = [
  "src/components/chrome/house-lead-chrome.tsx",
  "src/components/chrome/app-shell.tsx",
  "src/app/(app)/aggregation/messages/message-link.tsx",
  "src/lib/finance-dashboard.ts",
  "src/components/chrome/house-ai-mark.tsx",
  "src/app/(app)/actions.ts",
] as const;

describe("dead chrome and unused presentation (P1-5/P1-6/P1-7)", () => {
  it("deletes unused wrappers and keeps live SoT", () => {
    for (const path of DELETED) {
      expect(existsSync(path), path).toBe(false);
    }
    for (const path of KEPT) {
      expect(existsSync(path), path).toBe(true);
    }
  });
});
