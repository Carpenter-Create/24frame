import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import {
  SETTINGS,
  SETTINGS_DRILL_ACCENT_CLASS,
  SETTINGS_DRILL_COPY_CLASS,
  SETTINGS_DRILL_LEADING_BODY_CLASS,
  SETTINGS_DRILL_ROW_CLASS,
  SETTINGS_DRILL_VALUE_CLASS,
  SETTINGS_DRILL_VALUE_TRAIL_CLASS,
  SETTINGS_DRILL_VALUE_TRAIL_COPY_CLASS,
  SETTINGS_DRILL_VALUE_TRAIL_TEXT_CLASS,
  SETTINGS_EDIT_HELPER_CLASS,
  SETTINGS_GROUP_CLASS,
  SETTINGS_GROUP_LABEL_CLASS,
} from "@/lib/settings";
import { LEGAL_ENTITIES } from "@/lib/legal-entities";
import {
  SettingsDrillRow,
  SettingsEditPane,
  SettingsGroupList,
  SettingsGroupRow,
} from "./settings-drill";

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
    expect(html).toContain(SETTINGS_DRILL_COPY_CLASS);
    expect(html).not.toContain("data-settings-drill-value-trail");
    expect(html).not.toContain("data-settings-drill-readonly");
  });

  it("trails the value with the chevron on a PrefDrillGroup value drill", () => {
    const html = renderToStaticMarkup(
      createElement(SettingsDrillRow, {
        kind: "location",
        label: "Location",
        value: "Dallas, TX, US",
        href: "/settings/preferences/location",
        layout: "value-trail",
      }),
    );
    expect(html).toContain('data-settings-drill-row="location"');
    expect(html).toContain(SETTINGS_DRILL_ROW_CLASS);
    expect(html).toContain(SETTINGS_DRILL_VALUE_TRAIL_CLASS);
    expect(html).toContain(SETTINGS_DRILL_VALUE_TRAIL_COPY_CLASS);
    expect(html).toContain(SETTINGS_DRILL_VALUE_TRAIL_TEXT_CLASS);
    expect(html).toContain(">Dallas, TX, US<");
    expect(html).not.toContain(SETTINGS_DRILL_COPY_CLASS);
    expect(html).not.toContain("truncate");
    expect(html).not.toContain("self-start");
    expect(html).not.toContain("items-start");
    const copyAt = html.indexOf('data-settings-drill-value-copy=""');
    const chevronAt = html.indexOf('data-settings-drill-chevron=""');
    expect(copyAt).toBeGreaterThan(-1);
    expect(chevronAt).toBeGreaterThan(copyAt);
    expect(html.indexOf(">Location<")).toBeLessThan(html.indexOf(">Dallas, TX, US<"));
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

  it("keeps a leading slot far left — person rows, not Invite", () => {
    const html = renderToStaticMarkup(
      createElement(SettingsDrillRow, {
        kind: "team-u1",
        label: "Ada",
        value: "Account owner · Accepted",
        readOnly: true,
        leading: createElement("span", { "data-identity-avatar": "" }, "AD"),
      }),
    );
    expect(html).toContain("data-settings-drill-leading");
    expect(html).toContain("data-identity-avatar");
    expect(html).toContain(SETTINGS_DRILL_LEADING_BODY_CLASS);
    expect(html).toContain(SETTINGS_DRILL_COPY_CLASS);
    expect(html).not.toContain("data-settings-drill-value-trail");
    expect(html.indexOf("data-settings-drill-leading")).toBeLessThan(html.indexOf("Ada"));
    expect(html.indexOf("Ada")).toBeLessThan(html.indexOf("Account owner · Accepted"));
  });

  it("keeps person rows stacked when a value trail is requested", () => {
    const html = renderToStaticMarkup(
      createElement(SettingsDrillRow, {
        kind: "team-u1",
        label: "Ada",
        value: "Account owner · Accepted",
        readOnly: true,
        layout: "value-trail",
        leading: createElement("span", { "data-identity-avatar": "" }, "AD"),
      }),
    );
    expect(html).toContain("data-settings-drill-leading");
    expect(html).toContain(SETTINGS_DRILL_LEADING_BODY_CLASS);
    expect(html).toContain(SETTINGS_DRILL_COPY_CLASS);
    expect(html).not.toContain("data-settings-drill-value-trail");
  });

  it("renders an accent action row for tucked Add / Invite", () => {
    const html = renderToStaticMarkup(
      createElement(SettingsDrillRow, {
        kind: "entity-add",
        label: LEGAL_ENTITIES.addRow,
        href: LEGAL_ENTITIES.addHref,
        tone: "accent",
        cta: "entity-add",
      }),
    );
    expect(html).toContain('data-settings-drill-row="entity-add"');
    expect(html).toContain("data-entity-add-cta");
    expect(html).toContain(LEGAL_ENTITIES.addRow);
    expect(html).toContain(SETTINGS_DRILL_ACCENT_CLASS);
    expect(html).toContain(`href="${LEGAL_ENTITIES.addHref}"`);
  });
});

describe("SettingsGroupList", () => {
  it("is a quiet label over an inset grouped list", () => {
    const html = renderToStaticMarkup(
      createElement(
        SettingsGroupList,
        { label: LEGAL_ENTITIES.title, list: "entity" },
        createElement(
          SettingsGroupRow,
          null,
          createElement(SettingsDrillRow, {
            kind: "entity-add",
            label: LEGAL_ENTITIES.addRow,
            href: LEGAL_ENTITIES.addHref,
            tone: "accent",
          }),
        ),
      ),
    );
    expect(html).toContain("data-settings-group");
    expect(html).toContain("data-entity-list");
    expect(html).toContain(SETTINGS_GROUP_CLASS);
    expect(html).toContain(SETTINGS_GROUP_LABEL_CLASS);
    expect(html).toMatch(/<h2[^>]*>Legal Entities<\/h2>/);
    expect(html).toContain(LEGAL_ENTITIES.addRow);
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
        },
        createElement("div", { "data-theme-control": "" }, "picker"),
      ),
    );
    expect(html).toContain('data-settings-edit-pane=""');
    expect(html).not.toContain('data-settings-hub="preferences"');
    expect(html).toContain('data-settings-page-lead=""');
    expect(html).toContain(SETTINGS.themeHelper);
    expect(html).toContain(SETTINGS_EDIT_HELPER_CLASS);
    expect(html).toContain(`href="${SETTINGS.preferencesHref}"`);
    expect(html).toContain(">Preferences<");
    expect(html).not.toMatch(/href="\/settings"/);
    expect(html).toContain("picker");
    expect(html).toMatch(/<h1[^>]*>Theme<\/h1>/);
  });
});
