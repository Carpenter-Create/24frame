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
  SOCIAL_PROFILE_LINKS_SHEET_CLASS,
  SOCIAL_PROFILE_LINKS_SHEET_LINK_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_PROFILE_LINK } from "@/lib/social-icons";
import { socialProfilePublicLinks } from "@/lib/social-profile-links";
import { SocialProfileLinkRow, SocialProfileLinksSheet } from "./social-profile-links";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "social-profile-links.tsx"), "utf8");

describe("SocialProfileLinkRow", () => {
  it("omits the block when empty and renders a quiet icon rail for two or fewer", () => {
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
    expect(SOCIAL_PROFILE_LINKS_CLASS).toContain("flex-wrap");
    expect(SOCIAL_PROFILE_LINKS_CLASS).not.toContain("truncate");
    expect(SOCIAL_PROFILE_LINKS_CLASS).not.toContain("flex-nowrap");
    expect(html).toContain('data-social-profile-link="instagram"');
    expect(html).toContain('data-social-profile-link-glyph="instagram-logo"');
    expect(html).toContain('aria-label="Instagram"');
    expect(html).toContain('data-social-profile-link="imdb"');
    expect(html).toContain('data-social-profile-link-glyph="film-slate"');
    expect(html).toContain(`aria-label="${SOCIAL.profile.imdb}"`);
    expect(html).toContain(`width="${SOCIAL_ICON_SIZE_PROFILE_LINK}"`);
    expect(html).toContain(`height="${SOCIAL_ICON_SIZE_PROFILE_LINK}"`);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
    expect(html).not.toContain(">instagram.com/ada<");
    expect(html).not.toContain(">imdb.com/name/nm0000158<");
    expect(html).not.toContain(">website<");
    expect(html).not.toContain("data-social-profile-links-more");
  });

  it("shows every public link icon on the face and does not collapse the rest behind +N", () => {
    const html = renderToStaticMarkup(
      <SocialProfileLinkRow
        links={socialProfilePublicLinks({
          urls: [
            "https://ada.example",
            "https://instagram.com/ada",
            "https://youtube.com/@ada",
            "https://www.imdb.com/name/nm0000158/",
          ],
        })}
      />,
    );
    expect(html).toContain('data-social-profile-link-glyph="globe"');
    expect(html).toContain('aria-label="ada.example"');
    expect(html).toContain('data-social-profile-link-glyph="instagram-logo"');
    expect(html).toContain('aria-label="Instagram"');
    expect(html).toContain('data-social-profile-link-glyph="youtube-logo"');
    expect(html).toContain('aria-label="YouTube"');
    expect(html).toContain('data-social-profile-link-glyph="film-slate"');
    expect(html).toContain(`aria-label="${SOCIAL.profile.imdb}"`);
    expect(html).not.toContain(">instagram.com/ada<");
    expect(html).not.toContain(">youtube.com/@ada<");
    expect(html).not.toContain(">imdb.com/name/nm0000158<");
    expect(html).not.toContain("data-social-profile-links-more");
    expect(html).not.toContain(">+2<");
    expect(html).not.toContain("data-social-profile-links-sheet");
    expect(src).not.toContain("socialProfileLinksFace");
    expect(src).not.toContain("data-social-profile-links-more");
    expect(SOCIAL_PROFILE_LINKS_CLASS).toContain("flex-wrap");
  });

  it("uses a globe and the host name for an unknown link", () => {
    const html = renderToStaticMarkup(
      <SocialProfileLinkRow
        links={socialProfilePublicLinks({
          websiteUrl: "https://ada.example/press",
        })}
      />,
    );
    expect(html).toContain('data-social-profile-link="website"');
    expect(html).toContain('data-social-profile-link-glyph="globe"');
    expect(html).toContain('aria-label="ada.example"');
    expect(html).not.toContain(">website<");
    expect(html).not.toContain(">https://ada.example/press<");
  });

  it("lists every link as readable host text in the Links sheet", () => {
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
    expect(html).toContain(SOCIAL_PROFILE_LINKS_SHEET_CLASS);
    expect(html).toContain(SOCIAL_PROFILE_LINKS_SHEET_LINK_CLASS);
    expect(html).toContain(SOCIAL.profile.links);
    expect(html).toContain(SOCIAL.profile.shareClose);
    expect(html).toContain(">instagram.com/ada<");
    expect(html).toContain(">youtube.com/@ada<");
    expect(html).toContain(">x.com/ada<");
    expect(html).toContain("data-social-profile-links-sheet-link");
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("data-social-profile-link-glyph");
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
    expect(src).toContain("socialProfileLinkGlyph");
    expect(src).toContain("InstagramLogo");
    expect(src).toContain("GlobeSimple");
    expect(src).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(src).not.toContain("inline-flex size-6");
  });
});
