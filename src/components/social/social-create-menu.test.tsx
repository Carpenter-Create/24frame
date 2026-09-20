import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SocialCreateMenu } from "./social-create-menu";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_CREATE_MENU_INTENTS } from "@/lib/social-create-menu";

describe("SocialCreateMenu", () => {
  it("opens from a single trigger and lists the four Social intents in SoT order", () => {
    const html = renderToStaticMarkup(
      createElement(SocialCreateMenu, {
        trigger: createElement("button", { "data-social-create-menu": "", type: "button" }, "Create"),
      }),
    );
    expect(html).toContain("data-social-create-menu");
    expect(html).toContain("Create");

    const src = readFileSync("src/components/social/social-create-menu.tsx", "utf8");
    expect(src).toContain("MenuSurfaceContent");
    expect(src).toContain("density=\"panel\"");
    for (const intent of SOCIAL_CREATE_MENU_INTENTS) {
      expect(src).toContain("SOCIAL_CREATE_MENU_INTENTS");
      expect(intent.label).toBeTruthy();
    }
    expect(SOCIAL_CREATE_MENU_INTENTS[0]?.label).toBe(SOCIAL.create.photo);
    expect(SOCIAL_CREATE_MENU_INTENTS[1]?.label).toBe(SOCIAL.create.video);
    expect(SOCIAL_CREATE_MENU_INTENTS[2]?.label).toBe(SOCIAL.create.write);
    expect(SOCIAL_CREATE_MENU_INTENTS[3]?.label).toBe(SOCIAL.create.goLive);
  });
});
