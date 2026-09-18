import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LicensingStatusList } from "./licensing-status-list";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: ({ src, className }: { src: string; className?: string }) =>
    createElement("img", { src, className, alt: "" }),
}));

const TITLE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";

const groups = [
  {
    id: TITLE_A,
    title: "North Star",
    href: `/gc/titles/${TITLE_A}`,
    stillUrl: null,
    year: "2024",
    publicId: "24F-0001234",
    lastActivity: "2026-09-12T00:00:00.000Z",
    vendors: [
      {
        deliveryId: "d1",
        vendorId: "v1",
        vendorName: "Acme Distribution",
        status: "pending" as const,
        submittedAt: "2026-09-12T00:00:00.000Z",
      },
      {
        deliveryId: "d2",
        vendorId: "v2",
        vendorName: "Northwind",
        status: "live" as const,
        submittedAt: "2026-09-10T00:00:00.000Z",
      },
    ],
  },
];

describe("LicensingStatusList v2", () => {
  it("renders Titles parents with indented vendor tracks and no Deliver until selected", () => {
    const html = renderToStaticMarkup(createElement(LicensingStatusList, { groups }));
    expect(html).toContain('data-gc-licensing-title');
    expect(html).toContain("North Star");
    expect(html).toContain("Acme Distribution");
    expect(html).toContain("Northwind");
    expect(html).toContain("data-gc-licensing-indent");
    expect(html).toContain("data-status-progress");
    expect(html).toContain('data-gc-licensing-select');
    expect(html).not.toContain("data-gc-licensing-deliver=");
    expect(html).not.toContain("Create delivery");
    expect(html).not.toContain("Export metadata");
  });

  it("uses the house 24 indent token and Titles landscape art", () => {
    const src = readFileSync("src/components/licensing/licensing-status-list.tsx", "utf8");
    expect(src).toContain("TitlesLandscapeArt");
    expect(src).toContain("StatusProgressTrack");
    expect(src).toContain("licensingDeliverVisible");
    expect(src).toContain("LICENSING_VENDOR_INDENT_CLASS");
    expect(src).toContain("flex-col");
    expect(src).not.toContain("NewDeliveryForm");
    expect(src).not.toContain("ExportPanel");
  });
});
