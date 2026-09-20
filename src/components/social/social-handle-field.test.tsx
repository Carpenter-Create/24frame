import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL, socialProfilePublicUrl } from "@/lib/social";
import { SocialHandleField } from "./social-handle-field";

describe("SocialHandleField", () => {
  it("shows @ inside the field and the house URL preview", () => {
    const html = renderToStaticMarkup(
      <SocialHandleField id="social-handle" name="handle" defaultHandle="acarpcreate" />,
    );
    expect(html).toContain("data-social-handle-field");
    expect(html).toContain('value="@acarpcreate"');
    expect(html).toContain(`placeholder="${SOCIAL.profile.handlePlaceholder}"`);
    expect(html).toContain("data-social-handle-url");
    expect(html).toContain(socialProfilePublicUrl("acarpcreate"));
    expect(html).toContain("https://24frame.co/@acarpcreate");
    expect(html).not.toContain("app.24frame.co");
    expect(html).not.toContain("/social/u/");
    expect(html).not.toContain("/social/@");

    const cased = renderToStaticMarkup(
      <SocialHandleField id="social-handle" name="handle" defaultHandle="AdamC" />,
    );
    expect(cased).toContain('value="@AdamC"');
    expect(cased).toContain("https://24frame.co/@AdamC");
    expect(cased).not.toContain("/social/@");
  });

  it("keeps @ in an empty field and always shows the live URL preview", () => {
    const html = renderToStaticMarkup(
      <SocialHandleField id="social-handle" name="handle" defaultHandle="" />,
    );
    expect(html).toContain('value="@"');
    expect(html).toContain(`placeholder="${SOCIAL.profile.handlePlaceholder}"`);
    expect(html).toContain("data-social-handle-url");
    expect(html).toContain("https://24frame.co/@");
    expect(html).toContain(socialProfilePublicUrl(""));
    expect(html).not.toContain("app.24frame.co");
    expect(html).not.toContain("/social/u/");
  });

  it("keeps the required-handle check on the profile submit path", () => {
    const form = readFileSync("src/components/social/social-forms.tsx", "utf8");
    const actions = readFileSync("src/app/(app)/social/actions.ts", "utf8");
    expect(form).toContain("socialHandleRequiredError");
    expect(form).toContain("normalizeHandle");
    expect(form).toContain("SocialHandleField");
    expect(actions).toContain("socialHandleRequiredError");
    expect(actions).toContain("normalizeHandle");
    expect(actions).toContain("profileInsertRow");
  });
});
