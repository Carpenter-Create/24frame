import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OVERVIEW, OVERVIEW_AI_CHIPS, type OverviewPulseModel } from "@/lib/overview";

import { OverviewPulse } from "./overview-pulse";

const EMPTY: OverviewPulseModel = {
  revenueCents: null,
  topTitleNames: [],
  socialUnread: 0,
  socialEntered: false,
  socialAvatars: [],
  courses: [],
  needsYou: [],
  thisWeek: null,
};

describe("OverviewPulse", () => {
  it("renders pulse modules and 24Frame AI chips without invented stats", () => {
    const html = renderToStaticMarkup(createElement(OverviewPulse, { model: EMPTY }));
    expect(html).toContain("data-overview-pulse");
    expect(html).toContain(OVERVIEW.title);
    expect(html).toContain(OVERVIEW.subtitle);
    expect(html).toContain("data-overview-aggregation");
    expect(html).toContain("data-overview-education");
    expect(html).toContain("data-overview-needs-you");
    expect(html).toContain("data-overview-this-week");
    expect(html).toContain("data-overview-ai-next");
    expect(html).toContain("data-overview-social-empty");
    expect(html).toContain(OVERVIEW.enterSocial);
    expect(html).toContain(OVERVIEW.openDashboard);
    expect(html).toContain(OVERVIEW.openEducation);
    expect(html).toContain('href="/messages"');
    expect(html).toContain(OVERVIEW_AI_CHIPS[0]!.label);
    expect(html).not.toContain("$128,440");
    expect(html).not.toContain("62% complete");
    expect(html).not.toContain("Globee");
  });

  it("caps Education covers at five and shows percent only when supplied", () => {
    const html = renderToStaticMarkup(
      createElement(OverviewPulse, {
        model: {
          ...EMPTY,
          socialEntered: true,
          socialUnread: 7,
          socialAvatars: [{ id: "1", initials: "JK" }],
          courses: [
            {
              id: "c1",
              title: "Catalog basics",
              href: "/social/courses/catalog-basics",
              coverUrl: null,
              percent: 62,
            },
          ],
          revenueCents: 100000,
          topTitleNames: ["Horizon"],
          thisWeek: "1 attention item open",
        },
      }),
    );
    expect(html).toContain("data-overview-social");
    expect(html).toContain("7 messages");
    expect(html).toContain("JK");
    expect(html).toContain("Catalog basics");
    expect(html).toContain("62% complete");
    expect(html).toContain("Horizon");
    expect(html).toContain("1 attention item open");
    expect(html).not.toContain("data-overview-social-empty");
  });
});
