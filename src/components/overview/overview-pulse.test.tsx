import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HOUSE_MODULE_CLASS } from "@/lib/house-shell";
import { ASK_GLOBEE_TRY_PROMPTS } from "@/lib/ask-globee";
import { OVERVIEW, OVERVIEW_AI_CHIPS, type OverviewPulseModel } from "@/lib/overview";

import { OverviewPulse } from "./overview-pulse";

const src = readFileSync(new URL("./overview-pulse.tsx", import.meta.url), "utf8");

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
    expect(html).toContain("data-overview-education-empty");
    expect(html).toContain("data-overview-needs-you");
    expect(html).toContain("data-overview-this-week");
    expect(html).toContain("data-overview-ai-next");
    expect(html).toContain("data-overview-social-empty");
    expect(html).toContain(OVERVIEW.enterSocial);
    expect(html).toContain(OVERVIEW.enterEducation);
    expect(html).toContain(OVERVIEW.openDashboard);
    expect(html).toContain(HOUSE_MODULE_CLASS);
    expect(html).toContain('href="/messages"');
    expect(html).toContain(ASK_GLOBEE_TRY_PROMPTS[0]);
    expect(html).toContain(OVERVIEW_AI_CHIPS[0]!.label);
    expect(html).not.toContain(OVERVIEW.openEducation);
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
          socialAvatars: [{ id: "1", name: "Jordan Kane", photoUrl: null }],
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
    expect(html).toContain("data-overview-social-avatars");
    expect(html).toContain("data-social-avatar");
    expect(html).toContain("data-overview-education-covers");
    expect(html).toContain(OVERVIEW.openEducation);
    expect(html).toContain(OVERVIEW.openSocial);
    expect(html).toContain("7 messages");
    expect(html).toContain("JK");
    expect(html).not.toContain("Jordan Kane");
    expect(html).toContain("Catalog basics");
    expect(html).not.toContain("last message");
    expect(html).not.toContain("snippet");
    expect(html).not.toContain("/social/dms/");
    expect(src).toContain("SocialAvatar");
    expect(src).not.toContain("SocialConversationFaces");
    expect(src).not.toContain("StaffDirectory");
    expect(html).toContain("62% complete");
    expect(html).toContain("Horizon");
    expect(html).toContain("1 attention item open");
    expect(html).not.toContain("data-overview-social-empty");
  });
});
