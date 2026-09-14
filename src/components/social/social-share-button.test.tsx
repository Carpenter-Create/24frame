import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL, socialProfilePublicUrl } from "@/lib/social";
import { SocialShareButton } from "./social-share-button";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "social-share-button.tsx"), "utf8");

describe("SocialShareButton", () => {
  it("copies the canonical apex URL and does not open a native share sheet", () => {
    const html = renderToStaticMarkup(<SocialShareButton handle="acarpcreate" />);
    expect(html).toContain("data-social-share");
    expect(html).toContain(`data-social-share-url="${socialProfilePublicUrl("acarpcreate")}"`);
    expect(html).toContain(SOCIAL.profile.share);
    expect(html).not.toContain(SOCIAL.profile.shareCopied);
    expect(html).not.toContain("data-social-share-toast");
    expect(html).not.toContain("24frame.co/@acarpcreate</");
    expect(html).not.toContain("Copies ");
    expect(src).toContain("clipboard.writeText");
    expect(src).toContain("socialProfilePublicUrl");
    expect(src).toContain("data-social-share-toast");
    expect(src).toContain("InlineNotice");
    expect(src).toContain("SOCIAL_SHARE_TOAST_CLASS");
    expect(src).toContain("SOCIAL.profile.shareCopied");
    expect(src).toContain("{SOCIAL.profile.share}");
    expect(src).not.toContain("navigator.share");
    expect(src).not.toContain("shareCopies");
    expect(src).not.toContain("copied ? SOCIAL.profile.shareCopied");
  });
});
