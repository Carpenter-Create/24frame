import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    src,
    className,
    unoptimized,
  }: {
    src: string;
    className?: string;
    unoptimized?: boolean;
  }) => createElement("img", { src, className, alt: "", "data-unoptimized": unoptimized ? "" : undefined }),
}));

import { SocialMediaImage } from "./social-media-image";

describe("SocialMediaImage", () => {
  it("is the Social raster SoT — next/image, not a title Artwork fork", () => {
    const html = renderToStaticMarkup(
      <SocialMediaImage src="https://cf.example/posts/u/x.jpg" sizes="100vw" />,
    );
    expect(html).toContain('src="https://cf.example/posts/u/x.jpg"');
    expect(html).toContain("object-cover");
    const src = readFileSync("src/components/social/social-media-image.tsx", "utf8");
    expect(src).toContain("next/image");
    expect(src).toContain("isAnimatedRasterSrc");
    expect(src).not.toContain('from "@/components/layout/artwork"');
    expect(src).not.toContain("CLOUDINARY");
  });

  it("leaves animated GIFs unoptimised so frames survive", () => {
    const gif = renderToStaticMarkup(
      <SocialMediaImage src="https://cf.example/posts/u/x.gif?sig=1" sizes="100vw" />,
    );
    const still = renderToStaticMarkup(
      <SocialMediaImage src="https://cf.example/posts/u/x.jpg?sig=1" sizes="100vw" />,
    );
    expect(gif).toContain("data-unoptimized");
    expect(still).not.toContain("data-unoptimized");
  });
});
