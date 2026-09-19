import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HELP } from "@/lib/help";
import HelpCenterPage from "./page";

describe("HelpCenterPage", () => {
  it("renders the Help center stub — no invented articles", () => {
    const html = renderToStaticMarkup(createElement(HelpCenterPage));
    expect(html).toContain('data-help-section="center"');
    expect(html).toContain(HELP.center);
    expect(html).toContain(HELP.centerEmpty);
    expect(html).toContain("data-house-empty");
    expect(html).toContain(`href="${HELP.href}"`);
    expect(html).not.toContain("<article");
    expect(html).not.toContain("FAQ");
    expect(html).not.toContain("support@");
  });
});
