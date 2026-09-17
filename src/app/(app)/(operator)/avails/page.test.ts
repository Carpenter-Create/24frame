import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AVAILS_PAGE } from "@/lib/avails";

import AvailsPage from "./page";

describe("AvailsPage", () => {
  it("renders a quiet empty Avails shell with no list, grid, or track", () => {
    const html = renderToStaticMarkup(AvailsPage());

    expect(html).toContain(AVAILS_PAGE.title);
    expect(html).toContain("t-title");
    expect(html).not.toContain("data-status-progress");
    expect(html).not.toContain("data-titles-catalog");
    expect(html).not.toContain("territory");
    expect(html).not.toContain("grid-cols-3");
    expect(html).not.toContain("Nothing waiting.");
    expect(html).not.toContain("Add Title");
  });
});
