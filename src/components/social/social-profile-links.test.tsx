import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { APP_SHEET_HOST_CLASS } from "@/lib/house-sheet";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_PROFILE_LINK_CLASS,
  SOCIAL_PROFILE_LINKS_CLASS,
  SOCIAL_PROFILE_LINKS_MORE_CLASS,
} from "@/lib/social-chrome";
import { socialProfilePublicLinks } from "@/lib/social-profile-links";
import { SocialProfileLinkRow, SocialProfileLinksSheet } from "./social-profile-links";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "social-profile-links.tsx"), "utf8");

describe("SocialProfileLinkRow", () => {
  it("omits the block when empty and prints muted host text for two or fewer", () => {
    expect(renderToStaticMarkup(<SocialProfileLinkRow links={[]} />)).toBe("");

    const html = renderToStaticMarkup(
      <SocialProfileLinkRow
        links={socialProfilePublicLinks({
          websiteUrl: "https://instagram.com/ada",
          imdbUrl: "https://www.imdb.com/name/nm0000158/",
        })}
      />,
    );
    expect(html).toContain("data-social-profile-links");
    expect(html).toContain(SOCIAL_PROFILE_LINKS_CLASS);
    expect(html).toContain(SOCIAL_PROFILE_LINK_CLASS);
    expect(html).toContain(">instagram.com/ada<");
    expect(html).toContain(">imdb.com/name/nm0000158<");
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
    expect(html).not.toContain("data-social-profile-links-more");
    expect(html).not.toContain("data-social-icon");
    expect(html).not.toContain('aria-label="Instagram"');
  });

  it("shows two face links plus a quiet +N when more than two exist", () => {
    const html = renderToStaticMarkup(
      <SocialProfileLinkRow
        links={socialProfilePublicLinks({
          urls: [
            "https://instagram.com/ada",
            "https://youtube.com/@ada",
            "https://x.com/ada",
            "https://tiktok.com/@ada",
          ],
        })}
      />,
    );
    expect(html).toContain(">instagram.com/ada<");
    expect(html).toContain(">youtube.com/@ada<");
    expect(html).not.toContain(">x.com/ada<");
    expect(html).not.toContain(">tiktok.com/@ada<");
    expect(html).toContain("data-social-profile-links-more");
    expect(html).toContain(SOCIAL_PROFILE_LINKS_MORE_CLASS);
    expect(html).toContain(">+2<");
    expect(html).toContain(`aria-label="${SOCIAL.profile.links}"`);
    expect(html).not.toContain("data-social-profile-links-sheet");
  });

  it("lists every link in the Links sheet and drops the icon row SoT", () => {
    const links = socialProfilePublicLinks({
      urls: [
        "https://instagram.com/ada",
        "https://youtube.com/@ada",
        "https://x.com/ada",
      ],
    });
    const html = renderToStaticMarkup(
      <SocialProfileLinksSheet
        links={links}
        open
        onClose={() => undefined}
        titleId="links-sheet"
      />,
    );
    expect(html).toContain("data-social-profile-links-sheet");
    expect(html).toContain(APP_SHEET_HOST_CLASS);
    expect(html).toContain(SOCIAL.profile.links);
    expect(html).toContain(SOCIAL.profile.shareClose);
    expect(html).toContain(">instagram.com/ada<");
    expect(html).toContain(">youtube.com/@ada<");
    expect(html).toContain(">x.com/ada<");
    expect(html).toContain("data-social-profile-links-sheet-link");
    expect(html).toContain('rel="noopener noreferrer"');
    expect(
      renderToStaticMarkup(
        <SocialProfileLinksSheet
          links={links}
          open={false}
          onClose={() => undefined}
          titleId="links-sheet"
        />,
      ),
    ).toBe("");

    expect(src).toContain("createPortal");
    expect(src).toContain("Escape");
    expect(src).toContain("SOCIAL_PROFILE_LINKS_CLASS");
    expect(src).not.toContain("@phosphor-icons/react");
    expect(src).not.toContain("InstagramLogo");
    expect(src).not.toContain("GlobeSimple");
    expect(src).not.toContain("socialProfileLinkIconNames");
    expect(src).not.toContain("inline-flex size-6");
  });
});
