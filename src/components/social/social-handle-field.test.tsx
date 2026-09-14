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

  it("uses the empty placeholder when no handle is set", () => {
    const html = renderToStaticMarkup(
      <SocialHandleField id="social-handle" name="handle" defaultHandle="" />,
    );
    expect(html).toContain(`placeholder="${SOCIAL.profile.handlePlaceholder}"`);
    expect(html).toContain('value=""');
    expect(html).toContain("https://app.24frame.co/social/u/@");
  });
});
