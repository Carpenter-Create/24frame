import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HELP, HELP_ABSENT, HELP_STACK, HELP_STACK_CLASS } from "@/lib/help";
import { SETTINGS_GROUP_CLASS, SETTINGS_GROUP_LIST_CLASS } from "@/lib/settings";
import HelpPage from "./page";

describe("HelpPage", () => {
  it("renders the Get Help stack — not a house-empty door and not Settings chrome", () => {
    const html = renderToStaticMarkup(createElement(HelpPage));
    expect(html).toContain('data-help-page=""');
    expect(html).toContain('data-help-section="index"');
    expect(html).toContain('data-help-page-lead=""');
    expect(html).toContain('data-help-stack=""');
    expect(html).toContain("data-settings-group");
    expect(html).toContain(HELP_STACK_CLASS);
    expect(html).toContain(SETTINGS_GROUP_CLASS);
    expect(html).toContain(SETTINGS_GROUP_LIST_CLASS);
    expect(html).toContain(HELP.title);
    expect(html).toContain(HELP.helper);
    expect(html).toContain(HELP.back);
    expect(html).toContain(`href="${HELP.homeHref}"`);
    for (const item of HELP_STACK) {
      expect(html).toContain(`data-help-stack-item="${item.kind}"`);
      expect(html).toContain(item.label);
      expect(html).toContain(`href="${item.href}"`);
    }
    expect(html).not.toContain("data-house-empty");
    expect(html).not.toContain("data-settings-page");
    expect(html).not.toContain("data-settings-hub-list");
    expect(html).not.toContain("Help is empty.");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("support@");
    for (const absent of HELP_ABSENT) {
      expect(html).not.toContain(absent);
    }
  });
});
