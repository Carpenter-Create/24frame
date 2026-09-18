import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { NEWS_SOURCES } from "./news";
import { canonicalizeNewsUrl, parseNewsDate, parseNewsFeed } from "./news-rss";

const NOW = new Date("2026-09-18T18:00:00.000Z");

const RSS = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Variety</title>
    <item>
      <title><![CDATA[Harbor Cut lands a festival slot]]></title>
      <link>https://www.variety.com/harbor-cut/?utm_source=rss&amp;utm_medium=feed</link>
      <pubDate>Thu, 17 Sep 2026 12:00:00 GMT</pubDate>
      <description><![CDATA[<p>A long rewrite.</p><img src="https://evil.example/scrape.jpg" />]]></description>
      <media:thumbnail url="https://variety.com/thumbs/harbor.jpg" />
    </item>
    <item>
      <title>Old headline</title>
      <link>https://variety.com/old</link>
      <pubDate>Thu, 01 Aug 2026 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Same story again</title>
      <link>https://variety.com/harbor-cut</link>
      <pubDate>Thu, 17 Sep 2026 13:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Harbor Cut lands a festival slot</title>
      <link>https://variety.com/harbor-cut-alt</link>
      <pubDate>Thu, 17 Sep 2026 14:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Deadline exclusive</title>
    <link href="http://deadline.com/exclusive/" rel="alternate" />
    <published>2026-09-16T09:00:00Z</published>
    <summary>Do not republish this summary.</summary>
    <enclosure url="https://deadline.com/img/exclusive.png" type="image/png" />
  </entry>
</feed>`;

describe("canonicalizeNewsUrl", () => {
  it("https + host lower + strip www and tracking", () => {
    expect(
      canonicalizeNewsUrl("http://WWW.Variety.com/Harbor-Cut/?utm_source=rss&utm_campaign=x&id=1"),
    ).toBe("https://variety.com/Harbor-Cut?id=1");
    expect(canonicalizeNewsUrl("javascript:alert(1)")).toBeNull();
    expect(canonicalizeNewsUrl("/relative")).toBeNull();
  });
});

describe("parseNewsFeed", () => {
  it("keeps media thumbs, drops HTML-body images, and dedupes URL + title", () => {
    const items = parseNewsFeed(RSS, "variety", NOW);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      title: "Harbor Cut lands a festival slot",
      url: "https://variety.com/harbor-cut",
      canonical_url: "https://variety.com/harbor-cut",
      source: "variety",
      published_at: "2026-09-17T12:00:00.000Z",
      image_url: "https://variety.com/thumbs/harbor.jpg",
    });
    expect(JSON.stringify(items)).not.toContain("scrape.jpg");
    expect(JSON.stringify(items)).not.toContain("A long rewrite");
    expect(items.find((item) => item.title === "Old headline")).toBeUndefined();
  });

  it("reads Atom links and enclosure images, and upgrades http", () => {
    const items = parseNewsFeed(ATOM, "deadline", NOW);
    expect(items).toEqual([
      {
        title: "Deadline exclusive",
        url: "https://deadline.com/exclusive",
        canonical_url: "https://deadline.com/exclusive",
        source: "deadline",
        published_at: "2026-09-16T09:00:00.000Z",
        image_url: "https://deadline.com/img/exclusive.png",
      },
    ]);
    expect(JSON.stringify(items)).not.toContain("Do not republish");
  });

  it("does not invent a source outside the allowlist", () => {
    expect(parseNewsFeed(RSS, "variety", NOW)[0]?.source).toBe("variety");
    expect(NEWS_SOURCES).toHaveLength(11);
  });
});

describe("parseNewsDate", () => {
  it("accepts RSS and Atom timestamps", () => {
    expect(parseNewsDate("Thu, 17 Sep 2026 12:00:00 GMT")).toBe("2026-09-17T12:00:00.000Z");
    expect(parseNewsDate("2026-09-16T09:00:00Z")).toBe("2026-09-16T09:00:00.000Z");
    expect(parseNewsDate("nope")).toBeNull();
  });
});

describe("news-rss source", () => {
  it("does not scrape HTML bodies for thumbs", () => {
    const src = readFileSync(new URL("./news-rss.ts", import.meta.url), "utf8");
    expect(src).not.toMatch(/content:encoded|description.*img|cheerio|jsdom/i);
  });
});
