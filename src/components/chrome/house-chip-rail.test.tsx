import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  HOUSE_CHIP_RAIL_CHIP_CLASS,
  HOUSE_CHIP_RAIL_CLASS,
  HOUSE_CHIP_RAIL_STACK_CLASS,
} from "@/lib/house-chip-rail";
import { HouseChipRail } from "./house-chip-rail";

describe("HouseChipRail", () => {
  it("renders two stacked rows in one scrollport and hides when empty", () => {
    expect(renderToStaticMarkup(<HouseChipRail items={[]} renderItem={(item) => item} />)).toBe("");

    const html = renderToStaticMarkup(
      <HouseChipRail
        items={["Acting", "AI filmmaking", "Animation", "Casting"]}
        renderItem={(label) => (
          <span key={label} data-chip={label} className={HOUSE_CHIP_RAIL_CHIP_CLASS}>
            {label}
          </span>
        )}
      />,
    );
    expect(html).toContain("data-house-chip-rail");
    expect(html).toContain("data-house-chip-rail-stack");
    expect(html).toContain('data-house-chip-rail-row="0"');
    expect(html).toContain('data-house-chip-rail-row="1"');
    expect(html).toContain(HOUSE_CHIP_RAIL_CLASS);
    expect(html).toContain(HOUSE_CHIP_RAIL_STACK_CLASS);
    expect(html.match(/overflow-x-auto/g)?.length).toBe(1);
    expect(html).not.toContain("flex-wrap");
    expect(html).not.toContain("truncate");

    const top = html.slice(
      html.indexOf('data-house-chip-rail-row="0"'),
      html.indexOf('data-house-chip-rail-row="1"'),
    );
    const bottom = html.slice(html.indexOf('data-house-chip-rail-row="1"'));
    expect(top).toContain("Acting");
    expect(top).toContain("Animation");
    expect(top).not.toContain("AI filmmaking");
    expect(bottom).toContain("AI filmmaking");
    expect(bottom).toContain("Casting");
  });
});
