import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TITLE_STATUS_LABELS, type TitleStatus } from "@/lib/titles";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

vi.mock("next/image", () => ({
  default: ({
    src,
    className,
  }: {
    src: string;
    className?: string;
  }) => createElement("img", { src, className, alt: "" }),
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

import { TITLES_CATALOG } from "@/lib/titles-catalog";

import {
  TitlesCatalogFrame,
  TitlesCatalogHeader,
  TitlesCatalogList,
  TitlesCatalogListRow,
} from "./titles-catalog";

const ALL_STATUSES = Object.keys(TITLE_STATUS_LABELS) as TitleStatus[];

function renderRow(props: {
  href: string;
  title: string;
  stillUrl: string | null;
  status: string;
  statusLabel: string;
  year?: string | null;
}): string {
  return renderToStaticMarkup(createElement(TitlesCatalogListRow, props));
}

function openingTagWith(html: string, marker: string): string {
  const at = html.indexOf(marker);
  const start = html.lastIndexOf("<", at);
  const end = html.indexOf(">", at);
  return html.slice(start, end + 1);
}

describe("TitlesCatalogListRow craft", () => {
  it("is a landscape-thumb row — not a poster card", () => {
    const html = renderRow({
      href: "/titles/1",
      title: "Craft film",
      stillUrl: "https://cdn/wide.jpg",
      status: "live",
      statusLabel: TITLE_STATUS_LABELS.live,
      year: "2019",
    });
    const row = openingTagWith(html, 'data-titles-catalog-list-row=""');
    const frame = openingTagWith(html, 'data-titles-catalog-frame=""');

    expect(row).toContain("flex items-center");
    expect(row).toContain("px-[var(--space-4)]");
    expect(row).toContain("py-[var(--space-4)]");
    expect(frame).toContain("aspect-[16/9]");
    expect(frame).toContain("w-[40%]");
    expect(frame).toContain("md:w-[160px]");
    expect(frame).toContain("rounded-[var(--radius-lg)]");
    expect(frame).toContain('data-titles-catalog-crop="cover"');
    expect(html).not.toContain("aspect-[2/3]");
    expect(html).not.toContain("data-titles-catalog-card");
    expect(html).not.toContain("bg-gradient");
    expect(html).not.toContain("shadow");
    expect(html).not.toMatch(/hover:scale|group-hover:scale/);
  });

  it("keeps a null still as a muted camera wash — no image, no monogram", () => {
    const html = renderRow({
      href: "/titles/1",
      title: "Empty film",
      stillUrl: null,
      status: "draft",
      statusLabel: TITLE_STATUS_LABELS.draft,
    });

    expect(html).toContain("data-titles-catalog-empty-art");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('rel="preload"');
    expect(html).not.toContain("poster.jpg");
    expect(html).not.toContain("t-data select-none text-3xl");
  });

  it("keeps title ink, year quiet, and the status pill trailing", () => {
    const html = renderRow({
      href: "/titles/1",
      title: "Craft film",
      stillUrl: null,
      status: "live",
      statusLabel: TITLE_STATUS_LABELS.live,
      year: "2019",
    });
    const name = openingTagWith(html, 'data-titles-catalog-name=""');
    const year = openingTagWith(html, 'data-titles-catalog-year=""');

    expect(name).toContain("t-body font-medium text-ink");
    expect(name).not.toContain("t-heading");
    expect(year).toContain("t-body-sm text-ink-3");
    expect(html).toMatch(
      /data-titles-catalog-name[\s\S]*Craft film[\s\S]*data-titles-catalog-year[\s\S]*2019[\s\S]*data-titles-catalog-status[\s\S]*Live/,
    );
  });

  it("marks Live as the ink-selected fill and other statuses as hairline pills", () => {
    const live = renderRow({
      href: "/titles/1",
      title: "Craft film",
      stillUrl: null,
      status: "live",
      statusLabel: TITLE_STATUS_LABELS.live,
    });
    const draft = renderRow({
      href: "/titles/2",
      title: "Draft film",
      stillUrl: null,
      status: "draft",
      statusLabel: TITLE_STATUS_LABELS.draft,
    });
    const livePill = openingTagWith(live, 'data-titles-catalog-status=""');
    const draftPill = openingTagWith(draft, 'data-titles-catalog-status=""');

    expect(livePill).toContain("rounded-full");
    expect(livePill).toContain("bg-ink");
    expect(livePill).toContain("text-surface");
    expect(livePill).not.toContain("bg-accent");
    expect(livePill).not.toMatch(/green|emerald|success/);
    expect(draftPill).toContain("border-hairline");
    expect(draftPill).toContain("text-ink-2");
    expect(draftPill).not.toContain("bg-ink");
    expect(draftPill).not.toContain("bg-accent");
  });

  it("places title, year, and every TITLE_STATUS_LABELS pill — no delivered, no seventh unique", () => {
    for (const status of ALL_STATUSES) {
      const html = renderRow({
        href: `/titles/${status}`,
        title: `${status} film`,
        stillUrl: null,
        status,
        statusLabel: TITLE_STATUS_LABELS[status],
        year: status === "live" ? "2019" : null,
      });
      expect(html).toContain(`${status} film`);
      expect(html).toContain(TITLE_STATUS_LABELS[status]);
      if (status === "live") {
        expect(html).toContain("data-titles-catalog-year");
        expect(html).toContain("2019");
      } else {
        expect(html).not.toContain("data-titles-catalog-year");
      }
    }
    const labels = ALL_STATUSES.map((status) => TITLE_STATUS_LABELS[status]);
    expect(labels).toHaveLength(7);
    expect(new Set(labels).size).toBe(6);
    expect(TITLE_STATUS_LABELS.in_delivery).toBe("Submitted");
    expect(TITLE_STATUS_LABELS.submitted).toBe("Submitted");
    expect(labels).not.toContain("Delivered");
    expect(labels).not.toContain("delivered");
  });
});

describe("TitlesCatalogFrame craft", () => {
  it("uses house section air of 24 under the operate bar", () => {
    const html = renderToStaticMarkup(createElement(TitlesCatalogFrame));
    expect(html).toContain("gap-[var(--space-6)]");
    expect(html).toContain("md:gap-[var(--space-8)]");
    expect(html).not.toContain("gap-[var(--space-12)]");
    expect(html).not.toContain("gap-[var(--space-10)]");
  });

  it("keeps empty catalog on the same 24 section air", () => {
    const html = renderToStaticMarkup(createElement(TitlesCatalogFrame, { empty: true }));
    expect(html).toContain("gap-[var(--space-6)]");
    expect(html).not.toContain("md:gap-[var(--space-8)]");
  });
});

describe("TitlesCatalogHeader type lock", () => {
  it("keeps the page title on the 24px section step, not a second hero", () => {
    const html = renderToStaticMarkup(createElement(TitlesCatalogHeader));

    expect(html).toMatch(/<h1 class="t-section text-ink">Titles<\/h1>/);
    expect(html).toContain(TITLES_CATALOG.title);
    expect(html).not.toMatch(/<h1[^>]*t-display/);
    expect(html).not.toMatch(/<h1[^>]*t-title/);
    expect(html).not.toContain("t-heading");
  });

  it("puts count under the title", () => {
    const html = renderToStaticMarkup(
      createElement(TitlesCatalogHeader, { count: "7 in catalog" }),
    );

    expect(html).toContain("data-titles-catalog-count");
    expect(html).toContain("7 in catalog");
    expect(html).not.toContain("10 in catalog");
    expect(html).not.toContain("data-titles-catalog-operate");
    const titleAt = html.indexOf("<h1");
    const countAt = html.indexOf("data-titles-catalog-count");
    expect(titleAt).toBeGreaterThan(-1);
    expect(countAt).toBeGreaterThan(titleAt);
  });

  it("locks the page title to --text-title and the row title to --text-base", () => {
    const tokens = readFileSync(join(ROOT, "src/app/tokens.css"), "utf8");
    const globals = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");

    expect(tokens).toMatch(/--text-sm:\s*0\.8125rem;/);
    expect(tokens).toMatch(/--text-base:\s*0\.9375rem;/);
    expect(tokens).toMatch(/--text-title:\s*1\.5rem;/);
    expect(globals).toMatch(/\.t-section\s*\{[\s\S]*?font-size:\s*var\(--text-title\)/);
    expect(globals).toMatch(/\.t-body\s*\{[\s\S]*?font-size:\s*var\(--text-base\)/);
  });

  it("keeps Titles as the page title on phone and desktop", () => {
    const html = renderToStaticMarkup(createElement(TitlesCatalogHeader));
    expect(html).toMatch(/<h1 class="t-section text-ink">Titles<\/h1>/);
    expect(html).not.toContain("data-titles-catalog-identity");
    expect(html).not.toContain("Meridian Pictures");
  });
});

describe("TitlesCatalogList landscape row lock", () => {
  it("is one hairline list for phone and desktop — landscape thumb, no 5-up, no snap rail", () => {
    const html = renderToStaticMarkup(
      createElement(
        TitlesCatalogFrame,
        null,
        createElement(
          TitlesCatalogList,
          null,
          createElement(TitlesCatalogListRow, {
            href: "/titles/1",
            title: "Craft film",
            stillUrl: null,
            status: "live",
            statusLabel: TITLE_STATUS_LABELS.live,
            year: "2019",
          }),
        ),
      ),
    );
    const catalog = openingTagWith(html, 'data-titles-catalog=""');
    const list = openingTagWith(html, 'data-titles-catalog-list=""');
    const row = openingTagWith(html, 'data-titles-catalog-list-row=""');
    const frame = openingTagWith(html, 'data-titles-catalog-frame=""');
    const name = openingTagWith(html, 'data-titles-catalog-name=""');
    const year = openingTagWith(html, 'data-titles-catalog-year=""');
    const pill = openingTagWith(html, 'data-titles-catalog-status=""');

    expect(html).not.toContain("Recently added");
    expect(html).not.toContain("Recent");
    expect(html).not.toContain("Store");
    expect(html).not.toContain("Spotlight");
    expect(html).not.toContain("snap-x");
    expect(html).not.toContain("w-[140px]");
    expect(html).not.toContain("xl:grid-cols-5");
    expect(html).not.toContain("data-titles-catalog-grid");
    expect(catalog).toContain("px-[var(--space-4)]");
    expect(list).toContain("rounded-[var(--radius-lg)]");
    expect(list).toContain("border-hairline");
    expect(list).not.toContain("md:hidden");
    expect(row).toContain("border-b");
    expect(frame).toContain("aspect-[16/9]");
    expect(name).toContain("t-body font-medium text-ink");
    expect(year).toContain("t-body-sm text-ink-3");
    expect(html).toContain("2019");
    expect(pill).toContain("bg-ink");
    expect(pill).not.toContain("bg-accent");
    expect(html).not.toContain("bg-band");
    expect(html).not.toMatch(/\bStore\b/);
    expect(html.match(/data-titles-catalog-list=""/g) ?? []).toHaveLength(1);
  });
});
