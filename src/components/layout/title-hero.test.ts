import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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

import { TitleHero } from "./title-hero";

function openingTagWith(html: string, marker: string): string {
  const at = html.indexOf(marker);
  const start = html.lastIndexOf("<", at);
  const end = html.indexOf(">", at);
  return html.slice(start, end + 1);
}

describe("TitleHero landscape rematch", () => {
  it("opens with a 16:9 landscape frame on the house light canvas", () => {
    const html = renderToStaticMarkup(
      createElement(TitleHero, {
        title: "Craft film",
        backHref: "/titles",
        backLabel: "Titles",
        status: "live",
        statusLabel: "Live",
        bannerUrl: "https://cdn/wide.jpg",
      }),
    );
    const frame = openingTagWith(html, 'data-title-hero-frame=""');

    expect(html).toContain("data-title-hero");
    expect(frame).toContain("aspect-[16/9]");
    expect(frame).toContain("rounded-[var(--radius-lg)]");
    expect(html).toContain("https://cdn/wide.jpg");
    expect(html).toContain("Craft film");
    expect(html).toContain("Titles");
    expect(html).not.toContain("bg-band");
    expect(html).not.toContain("text-band-ink");
    expect(html).not.toContain("aspect-[2/3]");
    expect(html).not.toContain("from-black");
    expect(html).not.toContain("bg-gradient");
    expect(html).not.toContain("shadow-lg");
  });

  it("keeps missing artwork as a muted landscape placeholder", () => {
    const html = renderToStaticMarkup(
      createElement(TitleHero, {
        title: "Empty film",
        backHref: "/titles",
        status: "draft",
        statusLabel: "Draft",
        bannerUrl: null,
      }),
    );

    expect(html).toContain("data-title-hero-empty-art");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("poster.jpg");
    expect(html).not.toContain("t-data select-none text-3xl");
  });

  it("puts ink title and an ink status pill below the hero", () => {
    const html = renderToStaticMarkup(
      createElement(TitleHero, {
        title: "Craft film",
        backHref: "/titles",
        status: "live",
        statusLabel: "Live · 1 of 2 platforms",
        bannerUrl: null,
        facts: [{ label: "Release", value: "May 1, 2019" }],
      }),
    );
    const pill = openingTagWith(html, 'data-title-hero-status=""');

    expect(html).toContain("t-section");
    expect(html).toContain("Craft film");
    expect(html).toContain("Release");
    expect(html).toContain("May 1, 2019");
    expect(pill).toContain("bg-ink");
    expect(pill).toContain("text-surface");
    expect(pill).not.toContain("bg-accent");
    expect(html).not.toContain("Social");
    expect(html).not.toContain("Education");
    expect(html).not.toContain("Channels");
    expect(html).not.toContain("Insights");
  });
});
