import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL, socialProfilePublicUrl } from "@/lib/social";
import { SOCIAL_SHARE_CLASS } from "@/lib/social-chrome";
import { SocialShareButton } from "./social-share-button";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "social-share-button.tsx"), "utf8");

describe("SocialShareButton", () => {
  it("opens the share sheet from a quiet icon named Share profile", () => {
    const html = renderToStaticMarkup(<SocialShareButton handle="acarpcreate" />);
    expect(html).toContain("data-social-share");
    expect(html).toContain(`data-social-share-url="${socialProfilePublicUrl("acarpcreate")}"`);
    expect(html).toContain(`aria-label="${SOCIAL.profile.shareProfile}"`);
    expect(html).toContain('data-social-icon="share-network"');
    expect(html).toContain(SOCIAL_SHARE_CLASS);
    expect(html).not.toContain(`>${SOCIAL.profile.share}<`);
    expect(html).not.toContain("data-social-share-sheet");
    expect(html).not.toContain("data-social-share-toast");
    expect(html).not.toContain("24frame.co/@acarpcreate</");
    expect(html).not.toContain("Copies ");
    expect(SOCIAL_SHARE_CLASS).toContain("size-[44px]");
    expect(SOCIAL_SHARE_CLASS).toContain("min-h-[44px]");
    expect(SOCIAL_SHARE_CLASS).toContain("min-w-[44px]");
    expect(SOCIAL_SHARE_CLASS).toContain("shrink-0");
    expect(SOCIAL_SHARE_CLASS).toContain("rounded-full");
    expect(SOCIAL_SHARE_CLASS).not.toContain("flex-1");
    expect(SOCIAL_SHARE_CLASS).not.toContain("border");
    expect(SOCIAL_SHARE_CLASS).not.toContain("t-body");
    expect(src).toContain("SocialShareSheet");
    expect(src).toContain("setOpen(true)");
    expect(src).toContain("aria-label={SOCIAL.profile.shareProfile}");
    expect(src).not.toContain("{SOCIAL.profile.share}");
    expect(src).not.toContain("stretch");
    expect(src).not.toContain("clipboard.writeText");
    expect(src).not.toContain("InlineNotice");
    expect(src).not.toContain("SOCIAL_SHARE_TOAST_CLASS");
    expect(src).not.toContain("copied ? SOCIAL.profile.shareCopied");
  });
});
