import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_PROFILE_LINKS_FACE_MAX,
  SOCIAL_PROFILE_LINKS_MAX,
  composeSocialWebsiteUrlField,
  parseSocialExternalUrl,
  parseSocialProfileLinksWrite,
  parseSocialWebsiteUrlField,
  SOCIAL_LINK_PLATFORMS,
  SOCIAL_PROFILE_LINK_GLYPHS,
  socialLinkPlatform,
  socialProfileLinkAccessibleName,
  socialProfileLinkError,
  socialProfileLinkGlyph,
  socialProfileLinkReadableLabel,
  socialProfileLinksFace,
  socialProfileLinksMoreLabel,
  socialProfileLinksRowSummary,
  socialProfilePublicLinks,
} from "@/lib/social-profile-links";

describe("social profile links", () => {
  it("parses http(s) URLs and classifies known hosts", () => {
    expect(parseSocialExternalUrl("instagram.com/ada")).toBe("https://instagram.com/ada");
    expect(parseSocialExternalUrl("https://www.youtube.com/@ada")).toBe(
      "https://www.youtube.com/@ada",
    );
    expect(parseSocialExternalUrl("javascript:alert(1)")).toBeNull();
    expect(parseSocialExternalUrl("notaurl")).toBeNull();
    expect(socialLinkPlatform("https://instagram.com/ada")).toBe("instagram");
    expect(socialLinkPlatform("https://instagr.am/ada")).toBe("instagram");
    expect(socialLinkPlatform("https://youtu.be/abc")).toBe("youtube");
    expect(socialLinkPlatform("https://x.com/ada")).toBe("x");
    expect(socialLinkPlatform("https://twitter.com/ada")).toBe("x");
    expect(socialLinkPlatform("https://www.facebook.com/ada")).toBe("facebook");
    expect(socialLinkPlatform("https://fb.me/ada")).toBe("facebook");
    expect(socialLinkPlatform("https://www.linkedin.com/in/ada")).toBe("linkedin");
    expect(socialLinkPlatform("https://www.tiktok.com/@ada")).toBe("tiktok");
    expect(socialLinkPlatform("https://vimeo.com/123")).toBe("vimeo");
    expect(socialLinkPlatform("https://www.threads.net/@ada")).toBe("threads");
    expect(socialLinkPlatform("https://www.threads.com/@ada")).toBe("threads");
    expect(socialLinkPlatform("https://www.imdb.com/name/nm0000158/")).toBe("imdb");
    expect(socialLinkPlatform("https://ada.example")).toBe("website");
  });

  it("keeps website_url as one URL or a JSON array, never a twin column", () => {
    expect(parseSocialWebsiteUrlField(null)).toEqual([]);
    expect(parseSocialWebsiteUrlField("https://instagram.com/ada")).toEqual([
      "https://instagram.com/ada",
    ]);
    expect(
      parseSocialWebsiteUrlField(
        JSON.stringify(["https://instagram.com/ada", "https://youtube.com/@ada"]),
      ),
    ).toEqual(["https://instagram.com/ada", "https://youtube.com/@ada"]);
    expect(composeSocialWebsiteUrlField([])).toBeNull();
    expect(composeSocialWebsiteUrlField(["https://instagram.com/ada"])).toBe(
      "https://instagram.com/ada",
    );
    expect(
      composeSocialWebsiteUrlField(["https://instagram.com/ada", "https://youtube.com/@ada"]),
    ).toBe(JSON.stringify(["https://instagram.com/ada", "https://youtube.com/@ada"]));
  });

  it("rejects invalid writes and caps the list", () => {
    expect(parseSocialProfileLinksWrite(["https://instagram.com/ada", ""])).toEqual({
      urls: ["https://instagram.com/ada"],
      error: null,
    });
    expect(parseSocialProfileLinksWrite(["not-a-url"])).toEqual({
      urls: [],
      error: "invalid",
    });
    expect(socialProfileLinkError("invalid")).toBe(SOCIAL.profile.linkInvalid);
    expect(socialProfileLinkError("limit")).toBe(SOCIAL.profile.linkLimit);
    expect(SOCIAL_PROFILE_LINKS_MAX).toBe(8);
    const overflow = Array.from({ length: 9 }, (_, i) => `https://example.com/p${i}`);
    expect(parseSocialProfileLinksWrite(overflow)).toEqual({ urls: [], error: "limit" });
  });

  it("merges IMDb into the public list and does not double it", () => {
    const links = socialProfilePublicLinks({
      websiteUrl: "https://instagram.com/ada",
      imdbUrl: "https://www.imdb.com/name/nm0000158/",
    });
    expect(links.map((link) => link.platform)).toEqual(["instagram", "imdb"]);
    expect(links[0]?.url).toBe("https://instagram.com/ada");
    expect(links[0]?.label).toBe("instagram.com/ada");
    expect(links[1]?.label).toBe("imdb.com/name/nm0000158");
    expect(links.some((link) => link.url.includes("instagram.com"))).toBe(true);
    expect(links.every((link) => link.url.startsWith("http"))).toBe(true);

    const doubled = socialProfilePublicLinks({
      urls: ["https://www.imdb.com/name/nm0000158/?ref_=nv"],
      imdbUrl: "https://www.imdb.com/name/nm0000158/",
    });
    expect(doubled).toHaveLength(1);
    expect(doubled[0]?.platform).toBe("imdb");
    expect(doubled[0]?.label).toBe("imdb.com/name/nm0000158");
    expect(doubled[0]?.label).not.toBe(SOCIAL.profile.imdb);
    expect(socialProfilePublicLinks({ websiteUrl: null, imdbUrl: null })).toEqual([]);

    const unknown = socialProfilePublicLinks({
      websiteUrl: "https://ada.example/press",
    });
    expect(unknown).toEqual([
      {
        url: "https://ada.example/press",
        platform: "website",
        label: "website",
      },
    ]);
  });

  it("keeps readable host labels for the sheet and Edit drill, never a scheme URL", () => {
    expect(socialProfileLinkReadableLabel("https://instagram.com/ada")).toBe("instagram.com/ada");
    expect(socialProfileLinkReadableLabel("https://www.youtube.com/@ada")).toBe("youtube.com/@ada");
    expect(socialProfileLinkReadableLabel("https://x.com/ada")).toBe("x.com/ada");
    expect(socialProfileLinkReadableLabel("https://www.imdb.com/name/nm0000158/")).toBe(
      "imdb.com/name/nm0000158",
    );
    expect(socialProfileLinkReadableLabel("https://ada.example/press")).toBe("website");
    expect(socialProfileLinkReadableLabel("https://ada.example")).toBe("website");
  });

  it("names the face icon by platform label or host", () => {
    expect(socialProfileLinkAccessibleName("https://instagram.com/ada")).toBe("Instagram");
    expect(socialProfileLinkAccessibleName("https://www.youtube.com/@ada")).toBe("YouTube");
    expect(socialProfileLinkAccessibleName("https://x.com/ada")).toBe("X");
    expect(socialProfileLinkAccessibleName("https://www.imdb.com/name/nm0000158/")).toBe(
      SOCIAL.profile.imdb,
    );
    expect(socialProfileLinkAccessibleName("https://vimeo.com/123")).toBe("Vimeo");
    expect(socialProfileLinkAccessibleName("https://ada.example/press")).toBe("ada.example");
    expect(socialProfileLinkAccessibleName("https://www.ada.example")).toBe("ada.example");
    expect(socialProfileLinkAccessibleName("https://ada.example/press")).not.toBe("website");
    expect(socialProfileLinkAccessibleName("https://ada.example")).not.toContain("https://");
  });

  it("maps classified hosts to quiet glyphs and unknown hosts to a globe", () => {
    expect(Object.keys(SOCIAL_PROFILE_LINK_GLYPHS).sort()).toEqual(
      [...SOCIAL_LINK_PLATFORMS].sort(),
    );
    expect(socialProfileLinkGlyph("instagram")).toBe("instagram-logo");
    expect(socialProfileLinkGlyph("youtube")).toBe("youtube-logo");
    expect(socialProfileLinkGlyph("facebook")).toBe("facebook-logo");
    expect(socialProfileLinkGlyph("x")).toBe("x-logo");
    expect(socialProfileLinkGlyph("linkedin")).toBe("linkedin-logo");
    expect(socialProfileLinkGlyph("tiktok")).toBe("tiktok-logo");
    expect(socialProfileLinkGlyph("threads")).toBe("threads-logo");
    expect(socialProfileLinkGlyph("imdb")).toBe("film-slate");
    expect(socialProfileLinkGlyph("vimeo")).toBe("play");
    expect(socialProfileLinkGlyph("website")).toBe("globe");
  });

  it("caps the face at two links and labels overflow as +N", () => {
    expect(SOCIAL_PROFILE_LINKS_FACE_MAX).toBe(2);
    const three = socialProfilePublicLinks({
      urls: [
        "https://instagram.com/ada",
        "https://youtube.com/@ada",
        "https://x.com/ada",
      ],
    });
    expect(socialProfileLinksFace(three)).toEqual({
      face: three.slice(0, 2),
      overflow: 1,
    });
    expect(socialProfileLinksMoreLabel(1)).toBe("+1");
    expect(socialProfileLinksMoreLabel(3)).toBe("+3");
    expect(socialProfileLinksFace(three.slice(0, 2))).toEqual({
      face: three.slice(0, 2),
      overflow: 0,
    });
    expect(socialProfileLinksFace([])).toEqual({ face: [], overflow: 0 });
  });

  it("summarizes the Edit Profile Links drill row", () => {
    expect(socialProfileLinksRowSummary([])).toBe(SOCIAL.profile.linksAdd);
    expect(socialProfileLinksRowSummary([""])).toBe(SOCIAL.profile.linksAdd);
    expect(socialProfileLinksRowSummary(["https://instagram.com/ada"])).toBe("instagram.com/ada");
    expect(
      socialProfileLinksRowSummary(["https://instagram.com/ada", "https://youtube.com/@ada"]),
    ).toBe("instagram.com/ada +1");
  });
});
