import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL, socialProfilePublicUrl } from "@/lib/social";
import { SOCIAL_HANDLE_FIELD_LABEL_CLASS } from "@/lib/social-chrome";
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
    const field = readFileSync("src/components/social/social-handle-field.tsx", "utf8");
    expect(form).toContain("socialHandleInputError");
    expect(form).toContain("socialHandleDisplayError");
    expect(form).toContain("SocialHandleField");
    expect(actions).toContain("socialHandleInputError");
    expect(actions).toContain("lookupHandleCollision");
    expect(actions).toContain("profileInsertRow");
    expect(field).toContain("SOCIAL_HANDLE_FIELD_LABEL_CLASS");
    expect(field).not.toContain("<Label");
    expect(field).not.toContain("t-label");
  });

  it("uses sentence-case house labels, not t-label uppercase", () => {
    const html = renderToStaticMarkup(
      <SocialHandleField id="social-handle" name="handle" defaultHandle="" />,
    );
    expect(html).toContain(SOCIAL_HANDLE_FIELD_LABEL_CLASS);
    expect(html).not.toContain("t-label");
    expect(html).not.toContain("uppercase");
  });

  it("never maps an empty @ draft to a taken error on the create form", () => {
    const form = readFileSync("src/components/social/social-forms.tsx", "utf8");
    expect(form).toContain("socialHandleDisplayError(next, prev)");
    expect(form).not.toContain("socialHandleRequiredError");
  });
});
