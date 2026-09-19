import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import {
  SETTINGS,
  SETTINGS_DRILL_ROW_CLASS,
  SETTINGS_DRILL_VALUE_CLASS,
  SETTINGS_EDIT_HELPER_CLASS,
} from "@/lib/settings";
import { SettingsDrillRow, SettingsEditPane } from "./settings-drill";

describe("SettingsDrillRow", () => {
  it("renders a tappable label · value · chevron row", () => {
    const html = renderToStaticMarkup(
      createElement(SettingsDrillRow, {
        kind: "theme",
        label: SETTINGS.theme,
        value: "Light",
        href: SETTINGS.themeHref,
      }),
    );
    expect(html).toContain('data-settings-drill-row="theme"');
    expect(html).toContain(SETTINGS.theme);
    expect(html).toContain("Light");
    expect(html).toContain(`href="${SETTINGS.themeHref}"`);
    expect(html).toContain(SETTINGS_DRILL_ROW_CLASS);
    expect(html).toContain(SETTINGS_DRILL_VALUE_CLASS);
    expect(html).not.toContain("data-settings-drill-readonly");
  });

  it("drops the chevron on a read-only row — no fake drill-in", () => {
    const html = renderToStaticMarkup(
      createElement(SettingsDrillRow, {
        kind: "email",
        label: ACCOUNT_PROFILE.emailLabel,
        value: "ada@example.com",
        readOnly: true,
        helper: ACCOUNT_PROFILE.emailLocked,
      }),
    );
    expect(html).toContain('data-settings-drill-row="email"');
    expect(html).toContain("data-settings-drill-readonly");
    expect(html).toContain(ACCOUNT_PROFILE.emailLocked);
    expect(html).not.toContain("href=");
    expect(html).not.toContain("<a");
  });

  it("can carry a surface item attr — hub and Help keep their data hooks", () => {
    const html = renderToStaticMarkup(
      createElement(SettingsDrillRow, {
        kind: "profile",
        label: SETTINGS.profile,
        href: SETTINGS.profileHref,
        itemAttr: "data-settings-hub-list-item",
      }),
    );
    expect(html).toContain('data-settings-drill-row="profile"');
    expect(html).toContain('data-settings-hub-list-item="profile"');
  });

  it("keeps an optional badge on the label — Rights Holder default chip", () => {
    const html = renderToStaticMarkup(
      createElement(SettingsDrillRow, {
        kind: "entity-ent-1",
        label: "Acme LLC",
        value: "LLC · Wyoming",
        href: "/settings/organization/entities/ent-1",
        badge: createElement("span", { "data-default-chip": "" }, "Default"),
      }),
    );
    expect(html).toContain('data-settings-drill-row="entity-ent-1"');
    expect(html).toContain("Acme LLC");
    expect(html).toContain("LLC · Wyoming");
    expect(html).toContain("data-default-chip");
    expect(html).toContain("Default");
  });
});

describe("SettingsEditPane", () => {
  it("is back · title · helper · children — page-lead SoT", () => {
    const html = renderToStaticMarkup(
      createElement(
        SettingsEditPane,
        {
          title: SETTINGS.theme,
          helper: SETTINGS.themeHelper,
          pathname: SETTINGS.themeHref,
          hub: "preferences",
        },
        createElement("div", { "data-theme-control": "" }, "picker"),
      ),
    );
    expect(html).toContain('data-settings-edit-pane=""');
    expect(html).toContain('data-settings-hub="preferences"');
    expect(html).toContain('data-settings-page-lead=""');
    expect(html).toContain(SETTINGS.themeHelper);
    expect(html).toContain(SETTINGS_EDIT_HELPER_CLASS);
    expect(html).toContain(`href="${SETTINGS.preferencesHref}"`);
    expect(html).toContain("picker");
    expect(html).toMatch(/<h1[^>]*>Theme<\/h1>/);
  });
});
