import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CourseCover } from "./course-cover";

describe("CourseCover", () => {
  it("keeps 16:9 and stays quiet when no cover is signed", () => {
    const html = renderToStaticMarkup(<CourseCover title="Welcome to 24Frame" />);
    expect(html).toContain("data-course-cover");
    expect(html).toContain("aspect-video");
    expect(html).toContain("bg-surface-muted");
    expect(html).not.toContain("W");
    expect(html).not.toContain("Welcome");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("shadow");
  });

  it("renders a real cover when a signed URL exists", () => {
    const html = renderToStaticMarkup(
      <CourseCover title="Welcome to 24Frame" src="https://example.test/cover.jpg" />,
    );
    expect(html).toContain('src="https://example.test/cover.jpg"');
    expect(html).toContain('data-course-cover-tone="photo"');
    expect(html).not.toContain("W");
  });

  it("does not replace a signed cover with a plate even if tone is plate", () => {
    const html = renderToStaticMarkup(
      <CourseCover
        title="Welcome to 24Frame"
        src="https://example.test/cover.jpg"
        tone="plate"
        plateClass="bg-course-plate-1"
      />,
    );
    expect(html).toContain('src="https://example.test/cover.jpg"');
    expect(html).not.toContain("data-course-cover-orb");
    expect(html).not.toContain("data-course-cover-band");
  });

  it("does not keep a letter monogram", () => {
    const src = readFileSync("src/components/courses/course-cover.tsx", "utf8");
    expect(src).not.toContain("charAt");
    expect(src).not.toContain("initial");
    expect(src).not.toContain("text-3xl");
  });
});
