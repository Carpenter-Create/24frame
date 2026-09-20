import { describe, expect, it } from "vitest";

import { parseSocialImdbInput, socialImdbNameId, socialImdbNameUrl } from "./social-imdb";

describe("social IMDb Phase 1", () => {
  it("normalizes name URLs and nm ids to the canonical name page", () => {
    expect(socialImdbNameId("https://www.imdb.com/name/nm0000158/?ref_=nv")).toBe("nm0000158");
    expect(socialImdbNameId("http://m.imdb.com/name/nm0000158/")).toBe("nm0000158");
    expect(socialImdbNameId("nm0000158")).toBe("nm0000158");
    expect(socialImdbNameId("NM0000158")).toBe("nm0000158");
    expect(parseSocialImdbInput("https://www.imdb.com/name/nm0000158/")).toEqual({
      nameId: "nm0000158",
      url: "https://www.imdb.com/name/nm0000158/",
      error: null,
    });
    expect(socialImdbNameUrl("nm0000158")).toBe("https://www.imdb.com/name/nm0000158/");
  });

  it("treats blank as clear and rejects titles or junk", () => {
    expect(parseSocialImdbInput("")).toEqual({ nameId: null, url: null, error: null });
    expect(parseSocialImdbInput("   ")).toEqual({ nameId: null, url: null, error: null });
    expect(parseSocialImdbInput("https://www.imdb.com/title/tt0111161/").error).toBe("invalid");
    expect(parseSocialImdbInput("not-imdb").error).toBe("invalid");
    expect(socialImdbNameId("")).toBeNull();
  });
});
