import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_PROFILE_LINKS_MAX,
  composeSocialWebsiteUrlField,
  parseSocialExternalUrl,
  parseSocialProfileLinksWrite,
  parseSocialWebsiteUrlField,
  socialLinkPlatform,
  socialProfileLinkError,
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
    expect(socialLinkPlatform("https://youtu.be/abc")).toBe("youtube");
    expect(socialLinkPlatform("https://x.com/ada")).toBe("x");
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

  it("merges IMDb into the public icon row and does not double it", () => {
    const links = socialProfilePublicLinks({
      websiteUrl: "https://instagram.com/ada",
      imdbUrl: "https://www.imdb.com/name/nm0000158/",
    });
    expect(links.map((link) => link.platform)).toEqual(["instagram", "imdb"]);
    expect(links[0]?.url).toBe("https://instagram.com/ada");
    expect(links.some((link) => link.url.includes("instagram.com"))).toBe(true);
    expect(links.every((link) => link.url.startsWith("http"))).toBe(true);

    const doubled = socialProfilePublicLinks({
      urls: ["https://www.imdb.com/name/nm0000158/?ref_=nv"],
      imdbUrl: "https://www.imdb.com/name/nm0000158/",
    });
    expect(doubled).toHaveLength(1);
    expect(doubled[0]?.platform).toBe("imdb");
    expect(doubled[0]?.label).toBe(SOCIAL.profile.imdb);
    expect(socialProfilePublicLinks({ websiteUrl: null, imdbUrl: null })).toEqual([]);
  });
});
