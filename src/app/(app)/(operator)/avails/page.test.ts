import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { titleArtworkUrls } from "@/lib/artwork";
import { AVAILS_GRID_CLASS, AVAILS_PAGE } from "@/lib/avails";
import { LIST_PAGE } from "@/lib/list-bounds";
import { createClient } from "@/lib/supabase/server";

import AvailsPage from "./page";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/artwork", () => ({
  titleArtworkUrls: vi.fn(async () => new Map()),
}));
vi.mock("next/image", () => ({
  default: ({ src, className }: { src: string; className?: string }) =>
    createElement("img", { src, className, alt: "" }),
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children?: React.ReactNode;
  }) => createElement("a", { href, ...props }, children),
}));

function liveRow(
  i: number,
  extras: { title?: string; id?: string; catalog_id?: string } = {},
) {
  return {
    id: extras.id ?? `title-live-${i}`,
    title: extras.title ?? `Approved film ${i}`,
    catalog_id: extras.catalog_id ?? `GC-${i}`,
  };
}

function stubClient(titles: ReturnType<typeof liveRow>[] = []) {
  const titlesChain = {
    select: vi.fn(() => titlesChain),
    eq: vi.fn(() => titlesChain),
    is: vi.fn(() => titlesChain),
    order: vi.fn(() => titlesChain),
    range: vi.fn(async () => ({ data: titles, error: null })),
  };
  const from = vi.fn((table: string) => {
    if (table === "titles") return titlesChain;
    throw new Error(`unexpected from(${table})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from, titlesChain };
}

async function renderAvails() {
  return renderToStaticMarkup(await AvailsPage());
}

function openingTagWith(html: string, marker: string): string {
  const at = html.indexOf(marker);
  const start = html.lastIndexOf("<", at);
  const end = html.indexOf(">", at);
  return html.slice(start, end + 1);
}

describe("AvailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(titleArtworkUrls).mockResolvedValue(new Map());
  });

  it("reads only Approved (live) titles and skips soft-deleted rows", async () => {
    const { from, titlesChain } = stubClient([liveRow(1)]);

    await renderAvails();

    expect(from).toHaveBeenCalledWith("titles");
    expect(titlesChain.eq).toHaveBeenCalledWith("status", "live");
    expect(titlesChain.eq).not.toHaveBeenCalledWith("org_id", expect.anything());
    expect(titlesChain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(titlesChain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(titlesChain.range).toHaveBeenCalled();
  });

  it("renders a quiet empty when no live titles exist", async () => {
    stubClient([]);
    const html = await renderAvails();

    expect(html).toContain(AVAILS_PAGE.title);
    expect(html).toContain("t-title");
    expect(html).toContain("data-avails-empty");
    expect(html).toContain(AVAILS_PAGE.empty);
    expect(html).toContain("t-body-sm text-ink-3");
    expect(html).not.toContain("data-avails-grid");
    expect(html).not.toContain("data-titles-landscape-tile");
    expect(html).not.toContain("data-status-progress");
    expect(html).not.toContain("data-titles-catalog-list");
    expect(html).not.toContain("territory");
    expect(html).not.toContain("Add Title");
    expect(html).not.toContain("Nothing waiting.");
  });

  it("lays Approved titles in a 3-wide desktop / 1-wide phone grid of shared landscape tiles", async () => {
    stubClient([
      liveRow(1, { title: "Winter Light" }),
      liveRow(2, { title: "Harbor Lights" }),
      liveRow(3, { title: "North Shore" }),
    ]);
    vi.mocked(titleArtworkUrls).mockResolvedValue(
      new Map([
        ["title-live-1", { poster: "https://cdn/poster-1.jpg", banner: "https://cdn/wide-1.jpg" }],
        ["title-live-2", { poster: "https://cdn/poster-2.jpg", banner: null }],
        ["title-live-3", { poster: null, banner: "https://cdn/wide-3.jpg" }],
      ]),
    );

    const html = await renderAvails();
    const grid = openingTagWith(html, 'data-avails-grid=""');
    const tiles = html.match(/data-titles-landscape-tile=""/g) ?? [];
    const frames = html.match(/data-titles-catalog-frame=""/g) ?? [];

    expect(html).toContain(AVAILS_PAGE.title);
    expect(grid).toBe(`<div class="${AVAILS_GRID_CLASS}" data-avails-grid="">`);
    expect(grid).toContain("grid-cols-1");
    expect(grid).toContain("md:grid-cols-3");
    expect(grid).toContain("gap-[var(--space-4)]");
    expect(grid).not.toContain("grid-cols-2");
    expect(grid).not.toContain("xl:grid-cols-5");
    expect(tiles).toHaveLength(3);
    expect(frames).toHaveLength(3);
    expect(html).toContain("Winter Light");
    expect(html).toContain("Harbor Lights");
    expect(html).toContain("North Shore");
    expect(html).toContain('href="/gc/titles/title-live-1"');
    expect(html).toContain('href="/gc/titles/title-live-2"');
    expect(html).toContain('href="/gc/titles/title-live-3"');
    expect(html).toContain("https://cdn/wide-1.jpg");
    expect(html).toContain("https://cdn/wide-3.jpg");
    expect(html).not.toContain("https://cdn/poster-1.jpg");
    expect(html).not.toContain("https://cdn/poster-2.jpg");
    expect(html).toContain("aspect-[16/9]");
    expect(html).toContain('data-titles-catalog-crop="cover"');
    expect(html).toContain("data-titles-catalog-empty-art");
    expect(html).not.toContain("data-avails-empty");
    expect(html).not.toContain("data-status-progress");
    expect(html).not.toContain("data-titles-catalog-status");
    expect(html).not.toContain("data-titles-catalog-list-row");
    expect(html).not.toContain("territory");
    expect(html).not.toContain("Add Title");
    expect(html).not.toMatch(/hover:-translate|group-hover:scale|hover:scale/);
    expect(html).not.toContain("/titles/24F-");
  });

  it("says when the Approved read is truncated", async () => {
    stubClient(Array.from({ length: LIST_PAGE + 1 }, (_, i) => liveRow(i)));
    const html = await renderAvails();

    expect(html).toContain(AVAILS_PAGE.truncated(String(LIST_PAGE)));
    expect(html.match(/data-titles-landscape-tile=""/g) ?? []).toHaveLength(LIST_PAGE);
  });
});
