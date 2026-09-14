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
    expect(html).toContain("https://app.24frame.co/social/u/@acarpcreate");
  });

  it("keeps @ in an empty field and always shows the live URL preview", () => {
    const html = renderToStaticMarkup(
      <SocialHandleField id="social-handle" name="handle" defaultHandle="" />,
    );
    expect(html).toContain('value="@"');
    expect(html).toContain(`placeholder="${SOCIAL.profile.handlePlaceholder}"`);
    expect(html).toContain("data-social-handle-url");
    expect(html).toContain("https://app.24frame.co/social/u/@");
    expect(html).toContain(socialProfilePublicUrl(""));
  });

  it("keeps the required-handle check on the profile submit path", () => {
    const form = readFileSync("src/components/social/social-forms.tsx", "utf8");
    const actions = readFileSync("src/app/(app)/social/actions.ts", "utf8");
    expect(form).toContain("socialHandleRequiredError");
    expect(form).toContain("SocialHandleField");
    expect(actions).toContain("socialHandleRequiredError");
    expect(actions).toContain("profileInsertRow");
  });
});
