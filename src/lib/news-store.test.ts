import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock("@aws-sdk/lib-dynamodb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/lib-dynamodb")>();
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: () => ({ send: mockSend }),
    },
  };
});

import { NEWS_HOME_CAP, NEWS_WINDOW_MS, newsItemTtlEpoch } from "./news";
import type { NormalizedNewsItem } from "./news-rss";
import { dynamoNewsStore, memoryNewsStore } from "./news-store";

const NOW = new Date("2026-09-18T18:00:00.000Z");
const FLOOD_WWW =
  "https://www.joblo.com/wp-content/uploads/2026/09/zach-cregger-the-flood-2001.jpg";
const FLOOD_URL = "https://joblo.com/zach-cregger-the-flood-2001-influence";

function item(n: number, published_at: string): NormalizedNewsItem {
  return {
    title: `Headline ${n}`,
    url: `https://variety.com/h${n}`,
    canonical_url: `https://variety.com/h${n}`,
    source: "variety",
    published_at,
    image_url: null,
  };
}

function floodItem(image_url: string | null): NormalizedNewsItem {
  return {
    title: "Flood influence",
    url: FLOOD_URL,
    canonical_url: FLOOD_URL,
    source: "joblo",
    published_at: "2026-09-17T12:00:00.000Z",
    image_url,
  };
}

describe("memoryNewsStore", () => {
  it("upserts the same canonical URL once and keeps Home at 15 inside 90 days", async () => {
    const store = memoryNewsStore();
    const first = item(1, "2026-09-17T12:00:00.000Z");
    await store.upsertItems([first], NOW);
    await store.upsertItems([{ ...first, title: "Headline 1 again" }], NOW);
    const rows = await store.queryFeed({ limit: 20, now: NOW });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe("Headline 1 again");
    expect(newsItemTtlEpoch(first.published_at)).toBe(
      Math.floor((Date.parse(first.published_at) + NEWS_WINDOW_MS) / 1000),
    );

    const batch = Array.from({ length: 18 }, (_, i) =>
      item(i + 1, "2026-09-17T12:00:00.000Z"),
    );
    await store.upsertItems(batch, NOW);
    await store.upsertItems([item(99, "2026-06-01T12:00:00.000Z")], NOW);
    const home = await store.queryFeed({ limit: NEWS_HOME_CAP, now: NOW });
    expect(NEWS_HOME_CAP).toBe(15);
    expect(home).toHaveLength(15);
    expect(home.every((row) => row.published_at >= "2026-06-20T18:00:00.000Z")).toBe(true);

    const windowed = await store.queryFeed({ limit: 50, now: NOW });
    expect(windowed.some((row) => row.url.endsWith("/h99"))).toBe(false);
    expect(await store.purgeBefore("2026-06-20T18:00:00.000Z")).toBe(1);
  });

  it("null upsert preserves a www thumb; non-null incoming replaces", async () => {
    const store = memoryNewsStore();
    await store.upsertItems([floodItem(FLOOD_WWW)], NOW);
    await store.upsertItems([floodItem(null)], NOW);
    expect((await store.queryFeed({ limit: 5, now: NOW }))[0]?.image_url).toBe(FLOOD_WWW);

    const replacement = "https://www.joblo.com/wp-content/uploads/2026/09/replacement.jpg";
    await store.upsertItems([floodItem(replacement)], NOW);
    expect((await store.queryFeed({ limit: 5, now: NOW }))[0]?.image_url).toBe(replacement);
  });
});

describe("dynamoNewsStore upsertItems", () => {
  const table = new Map<string, Record<string, unknown>>();

  beforeEach(() => {
    table.clear();
    mockSend.mockReset();
    mockSend.mockImplementation(async (cmd: unknown) => {
      if (cmd instanceof GetCommand) {
        const key = `${cmd.input.Key?.pk}#${cmd.input.Key?.sk}`;
        return { Item: table.get(key) };
      }
      if (cmd instanceof PutCommand) {
        const row = cmd.input.Item as { pk: string; sk: string };
        table.set(`${row.pk}#${row.sk}`, row);
        return {};
      }
      return {};
    });
  });

  it("Get-then-merge: null upsert keeps www; a later non-null replaces", async () => {
    const store = dynamoNewsStore({
      NEWS_AWS_REGION: "us-west-2",
      NEWS_DDB_TABLE: "24frame-news-test",
    });
    await store.upsertItems([floodItem(FLOOD_WWW)], NOW);
    await store.upsertItems([floodItem(null)], NOW);
    const afterNull = [...table.values()].find((row) => row.canonical_url === FLOOD_URL);
    expect(afterNull?.image_url).toBe(FLOOD_WWW);

    const replacement = "https://www.joblo.com/wp-content/uploads/2026/09/replacement.jpg";
    await store.upsertItems([floodItem(replacement)], NOW);
    const afterReplace = [...table.values()].find((row) => row.canonical_url === FLOOD_URL);
    expect(afterReplace?.image_url).toBe(replacement);
    expect(mockSend.mock.calls.some((call) => call[0] instanceof GetCommand)).toBe(true);
  });
});

describe("news-store source", () => {
  it("fails if either upsert drops mergeNewsImageUrl / Dynamo Get-before-Put", () => {
    const src = readFileSync(new URL("./news-store.ts", import.meta.url), "utf8");
    expect(src).toContain("mergeNewsImageUrl");
    const upserts = src.split("async upsertItems");
    expect(upserts.length).toBe(3);
    expect(upserts[1]).toContain("mergeNewsImageUrl");
    expect(upserts[2]).toContain("mergeNewsImageUrl");
    expect(upserts[2]).toContain("GetCommand");
    expect(upserts[2]).toMatch(/image_url:\s*mergeNewsImageUrl/);
    expect(upserts[2]).not.toMatch(/image_url:\s*row\.image_url/);
  });
});
