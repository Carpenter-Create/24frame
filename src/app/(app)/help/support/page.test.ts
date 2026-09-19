import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HELP } from "@/lib/help";
import HelpSupportPage from "./page";

describe("HelpSupportPage", () => {
  it("renders the Contact support stub — no mailto SoT", () => {
    const html = renderToStaticMarkup(createElement(HelpSupportPage));
    expect(html).toContain('data-help-section="support"');
    expect(html).toContain(HELP.support);
    expect(html).toContain(HELP.supportEmpty);
    expect(html).toContain("data-house-empty");
    expect(html).toContain(`href="${HELP.href}"`);
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("support@");
    expect(html).not.toContain("<form");
  });
});
