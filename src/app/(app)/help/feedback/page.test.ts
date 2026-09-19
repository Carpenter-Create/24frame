import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HOUSE_EMPTY_CLASS } from "@/lib/house-sheet";
import { HELP } from "@/lib/help";
import HelpFeedbackPage from "./page";

describe("HelpFeedbackPage", () => {
  it("renders the Give feedback blank — form later on this same route", () => {
    const html = renderToStaticMarkup(createElement(HelpFeedbackPage));
    expect(html).toContain('data-help-feedback=""');
    expect(html).toContain('data-help-section="feedback"');
    expect(html).toContain(HELP.feedback);
    expect(html).toContain(HELP.feedbackHelper);
    expect(html).toContain(HELP.feedbackEmpty);
    expect(html).toContain("data-house-empty");
    expect(html).toContain(HOUSE_EMPTY_CLASS);
    expect(html).toContain(`href="${HELP.href}"`);
    expect(html).toContain(HELP.title);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<textarea");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("data-settings-page");
    expect(html).not.toContain("/account/feedback");
    expect(html).not.toContain("support@");
  });
});
