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
  it("opens the share sheet and keeps the trigger label Share", () => {
    const html = renderToStaticMarkup(<SocialShareButton handle="acarpcreate" />);
    expect(html).toContain("data-social-share");
    expect(html).toContain(`data-social-share-url="${socialProfilePublicUrl("acarpcreate")}"`);
    expect(html).toContain(SOCIAL.profile.share);
    expect(html).not.toContain("data-social-share-sheet");
    expect(html).not.toContain("data-social-share-toast");
    expect(html).not.toContain("24frame.co/@acarpcreate</");
    expect(html).not.toContain("Copies ");
    expect(src).toContain("SocialShareSheet");
    expect(src).toContain("setOpen(true)");
    expect(src).toContain("{SOCIAL.profile.share}");
    expect(src).not.toContain("clipboard.writeText");
    expect(src).not.toContain("InlineNotice");
    expect(src).not.toContain("SOCIAL_SHARE_TOAST_CLASS");
    expect(src).not.toContain("copied ? SOCIAL.profile.shareCopied");
  });
});
