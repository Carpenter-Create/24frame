import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SETTINGS } from "@/lib/settings";
import SettingsSocialPage from "./page";

describe("SettingsSocialPage", () => {
  it("houses Social prefs empty — no invented toggles", () => {
    const html = renderToStaticMarkup(createElement(SettingsSocialPage));
    expect(html).toContain('data-settings-hub="social"');
    expect(html).toContain(SETTINGS.title);
    expect(html).toContain(SETTINGS.social);
    expect(html).toContain(SETTINGS.socialEmpty);
    expect(html).toContain("data-house-empty");
    expect(html).not.toContain(SETTINGS.manageCourses);
    expect(html).not.toContain("MasterClass");
    expect(html).not.toContain("Stripe");
  });
});
