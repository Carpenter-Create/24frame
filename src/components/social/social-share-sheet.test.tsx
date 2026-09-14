import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL, socialProfilePublicUrl } from "@/lib/social";
import {
  SOCIAL_SHARE_SHEET_ACTION_CLASS,
  SOCIAL_SHARE_SHEET_CARD_CLASS,
  SOCIAL_SHARE_SHEET_WASH_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_SHARE_QR_MARK } from "@/lib/social-share-sheet";
import { SocialShareSheet } from "./social-share-sheet";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "social-share-sheet.tsx"), "utf8");

describe("SocialShareSheet", () => {
  it("renders the locked QR card and three actions when open", () => {
    const html = renderToStaticMarkup(<SocialShareSheet handle="maya" open onClose={() => undefined} />);
    expect(html).toContain("data-social-share-sheet");
    expect(html).toContain(`data-social-share-url="${socialProfilePublicUrl("maya")}"`);
    expect(html).toContain("data-social-share-card");
    expect(html).toContain("data-social-share-qr");
    expect(html).toContain("data-social-share-qr-mark");
    expect(html).toContain(SOCIAL_SHARE_QR_MARK);
    expect(html).toContain("@MAYA");
    expect(html).toContain("data-social-share-profile");
    expect(html).toContain("data-social-share-copy");
    expect(html).toContain("data-social-share-download");
    expect(html).toContain(SOCIAL.profile.shareProfile);
    expect(html).toContain(SOCIAL.profile.shareCopyLink);
    expect(html).toContain(SOCIAL.profile.shareDownload);
    expect(html).toContain(SOCIAL.profile.shareClose);
    expect(html).toContain(SOCIAL_SHARE_SHEET_CARD_CLASS);
    expect(html).toContain(SOCIAL_SHARE_SHEET_ACTION_CLASS);
    expect(html).toContain(SOCIAL_SHARE_SHEET_WASH_CLASS);
    expect(html).toContain('data-social-icon="share-network"');
    expect(html).toContain('data-social-icon="link"');
    expect(html).toContain('data-social-icon="download-simple"');
    expect(html).toContain('data-social-icon="x"');
    expect(html).not.toContain(">WASH<");
    expect(html).not.toContain("Education");
    expect(html).not.toContain(">24frame.co/@maya<");
    expect(html).not.toContain("Copies ");
    expect(html).not.toContain("shadow");
  });

  it("renders nothing when closed", () => {
    const html = renderToStaticMarkup(
      <SocialShareSheet handle="maya" open={false} onClose={() => undefined} />,
    );
    expect(html).toBe("");
    expect(src).toContain("createPortal");
    expect(src).toContain("Escape");
  });
});
