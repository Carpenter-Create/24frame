import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ACTIVITY, ACTIVITY_HREF } from "@/lib/activity";
import { ASK_ASSISTANT } from "@/lib/product";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/app/(app)/activity/actions", () => ({ markActivityDone: vi.fn() }));

import { ActivityBell } from "./activity-bell";
import { AskAssistantEntry } from "./ask-assistant-entry";

const PREVIEW: ActivityBellPreview = {
  openCount: 3,
  items: [
    {
      id: "n1",
      title: "North Wind is live",
      body: "Delivery advanced.",
      href: "/titles/aaaaaaaa-1111-4111-8111-111111111111",
      at: "2026-09-18T12:00:00.000Z",
      kind: "delivery_update",
      kindLabel: "Delivery update",
      open: true,
    },
  ],
};

describe("ActivityBell", () => {
  it("renders the house header bell with View all → /activity", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityBell, { preview: PREVIEW, openCount: 3 }),
    );
    const src = readFileSync(new URL("./activity-bell.tsx", import.meta.url), "utf8");
    expect(html).toContain('data-activity-bell=""');
    expect(html).toContain(`aria-label="${ACTIVITY.bellLabel}"`);
    expect(src).toContain("data-activity-bell-badge");
    expect(src).toContain("ACTIVITY.viewAll");
    expect(src).toContain("ACTIVITY_HREF");
    expect(src).toContain("ACTIVITY.markDone");
    expect(src).toContain("data-activity-bell-view-all");
    expect(html).not.toContain("Messages");
    expect(ACTIVITY_HREF).toBe("/activity");
  });
});

describe("AskAssistantEntry", () => {
  it("wires Ask 24Frame AI to /messages from shared header chrome", () => {
    const html = renderToStaticMarkup(createElement(AskAssistantEntry));
    expect(html).toContain('data-ask-assistant-entry=""');
    expect(html).toContain(`aria-label="${ASK_ASSISTANT}"`);
    expect(html).toContain('href="/messages"');
    expect(html).not.toContain("Globee");
    expect(ASK_ASSISTANT).toBe("Ask 24Frame AI");
  });
});
