import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { titleArtworkUrls } from "@/lib/artwork";
import { AVAILS_PAGE } from "@/lib/avails";
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

function stubClient(
  titles: { id: string; title: string }[] = [],
) {
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

describe("AvailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(titleArtworkUrls).mockResolvedValue(new Map());
  });

  it("renders a quiet empty when no Approved titles exist", async () => {
    stubClient([]);
    const html = renderToStaticMarkup(await AvailsPage());

    expect(html).toContain(AVAILS_PAGE.title);
    expect(html).toContain("t-title");
    expect(html).toContain(AVAILS_PAGE.empty);
    expect(html).toContain("data-avails-empty");
    expect(html).not.toContain("data-avails-grid");
    expect(html).not.toContain("data-status-progress");
    expect(html).not.toContain("data-titles-catalog-list");
    expect(html).not.toContain("territory");
    expect(html).not.toContain("Nothing waiting.");
    expect(html).not.toContain("Add Title");
  });

  it("loads live titles only and paints avails-grid-3 landscape tiles to staff detail", async () => {
    const { from, titlesChain } = stubClient([
      { id: "live-1", title: "Approved one" },
      { id: "live-2", title: "Approved two" },
    ]);
    vi.mocked(titleArtworkUrls).mockResolvedValue(
      new Map([
        ["live-1", { poster: "https://cdn/poster.jpg", banner: "https://cdn/wide.jpg" }],
      ]),
    );

    const html = renderToStaticMarkup(await AvailsPage());

    expect(from).toHaveBeenCalledWith("titles");
    expect(titlesChain.eq).toHaveBeenCalledWith("status", "live");
    expect(titlesChain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(titlesChain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(titleArtworkUrls).toHaveBeenCalledWith(expect.anything(), ["live-1", "live-2"]);
    expect(html).toContain("data-avails-grid");
    expect(html).toContain("md:grid-cols-3");
    expect(html).toContain("grid-cols-1");
    expect(html).toContain("gap-[var(--space-4)]");
    expect(html).toContain("data-titles-landscape-art");
    expect(html).toContain("aspect-[16/9]");
    expect(html).toContain("Approved one");
    expect(html).toContain("Approved two");
    expect(html).toContain('href="/gc/titles/live-1"');
    expect(html).toContain('href="/gc/titles/live-2"');
    expect(html).toContain("https://cdn/wide.jpg");
    expect(html).not.toContain("https://cdn/poster.jpg");
    expect(html).not.toContain("data-status-progress");
    expect(html).not.toContain("data-titles-catalog-list-row");
    expect(html).not.toContain("grid-cols-2");
    expect(html).not.toContain("aspect-[2/3]");
    expect(html).not.toContain("territory");
  });

  it("bounds the cross-org Approved read and says when the page is truncated", async () => {
    const overflow = Array.from({ length: LIST_PAGE + 1 }, (_, i) => ({
      id: `live-${i}`,
      title: `Approved ${i}`,
    }));
    const { titlesChain } = stubClient(overflow);

    const html = renderToStaticMarkup(await AvailsPage());

    expect(titlesChain.range).toHaveBeenCalled();
    expect(html).toContain(AVAILS_PAGE.truncated(LIST_PAGE));
    expect(html).toContain("data-avails-grid");
    expect(html.match(/data-avails-tile=""/g)?.length).toBe(LIST_PAGE);
  });
});
