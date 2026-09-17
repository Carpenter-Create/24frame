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

describe("TitleHero album-grammar rematch", () => {
  it("puts leading landscape art beside title, status, and quiet meta", () => {
    const html = renderToStaticMarkup(
      createElement(TitleHero, {
        title: "Craft film",
        backHref: "/titles",
        backLabel: "Titles",
        status: "live",
        bannerUrl: "https://cdn/wide.jpg",
        meta: ["2019", "Drama", "24F-0001234"],
      }),
    );
    const band = openingTagWith(html, 'data-title-hero-band=""');
    const frame = openingTagWith(html, 'data-title-hero-frame=""');

    expect(html).toContain("data-title-hero");
    expect(band).toContain("flex flex-col");
    expect(band).toContain("md:flex-row");
    expect(frame).toContain("aspect-[16/9]");
    expect(frame).toContain("rounded-[var(--radius-lg)]");
    expect(frame).toContain('data-title-hero-art="landscape"');
    expect(html).toContain("https://cdn/wide.jpg");
    expect(html).toContain("Craft film");
    expect(html).toContain("t-title");
    expect(html).toContain("2019 · Drama · 24F-0001234");
    expect(html).toContain("Titles");
    expect(html).not.toContain("bg-band");
    expect(html).not.toContain("text-band-ink");
    expect(html).not.toContain("aspect-[2/3]");
    expect(html).not.toContain("from-black");
    expect(html).not.toContain("bg-gradient");
    expect(html).not.toContain("shadow-lg");
  });

  it("uses a square crop when only a poster exists", () => {
    const html = renderToStaticMarkup(
      createElement(TitleHero, {
        title: "Poster film",
        backHref: "/titles",
        status: "draft",
        bannerUrl: null,
        posterUrl: "https://cdn/poster.jpg",
      }),
    );
    const frame = openingTagWith(html, 'data-title-hero-frame=""');
    expect(frame).toContain("aspect-square");
    expect(frame).toContain('data-title-hero-art="square"');
    expect(html).toContain("https://cdn/poster.jpg");
  });

  it("keeps missing artwork as a muted landscape placeholder", () => {
    const html = renderToStaticMarkup(
      createElement(TitleHero, {
        title: "Empty film",
        backHref: "/titles",
        status: "draft",
        bannerUrl: null,
      }),
    );

    expect(html).toContain("data-title-hero-empty-art");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("poster.jpg");
    expect(html).not.toContain("t-data select-none text-3xl");
  });

  it("puts the lifecycle track with the title and actions under the meta", () => {
    const html = renderToStaticMarkup(
      createElement(TitleHero, {
        title: "Craft film",
        backHref: "/titles",
        status: "in_delivery",
        liveCount: 1,
        bannerUrl: null,
        meta: ["May 1, 2019"],
        action: createElement("button", { "data-title-play-trailer": "" }, "Play trailer"),
      }),
    );
    const track = openingTagWith(html, 'data-title-hero-status=""');

    expect(html).toContain("t-title");
    expect(html).toContain("Craft film");
    expect(html).toContain("May 1, 2019");
    expect(html).toContain("data-title-hero-actions");
    expect(html).toContain("Play trailer");
    expect(track).toContain('data-status-progress-variant="pipeline"');
    expect(html.match(/data-status-progress-seg="filled"/g) ?? []).toHaveLength(5);
    expect(html).toContain("Approved");
    expect(html).not.toContain("Approved · 1 of 2 platforms");
    expect(html).not.toContain("Social");
    expect(html).not.toContain("Education");
    expect(html).not.toContain("Channels");
    expect(html).not.toContain("Insights");
  });
});
