import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SquaresFour } from "@phosphor-icons/react";

import {
  PHOSPHOR_CHROME_ACTIVE_WEIGHT,
  PHOSPHOR_CHROME_ICON_CLASS,
  PHOSPHOR_CHROME_IDLE_WEIGHT,
  PhosphorChromeIcon,
  phosphorChromeWeight,
} from "./phosphor-icon";

describe("Phosphor chrome primitive", () => {
  it("is Bold idle and Fill active — not Lucide, not a cousin weight", () => {
    expect(PHOSPHOR_CHROME_IDLE_WEIGHT).toBe("bold");
    expect(PHOSPHOR_CHROME_ACTIVE_WEIGHT).toBe("fill");
    expect(PHOSPHOR_CHROME_ICON_CLASS).toBe("size-4 shrink-0");
    expect(phosphorChromeWeight(false)).toBe("bold");
    expect(phosphorChromeWeight(true)).toBe("fill");

    const idle = renderToStaticMarkup(<PhosphorChromeIcon icon={SquaresFour} />);
    const active = renderToStaticMarkup(
      <PhosphorChromeIcon icon={SquaresFour} active />,
    );
    expect(idle).toContain('class="size-4 shrink-0"');
    expect(active).toContain('class="size-4 shrink-0"');
    expect(idle).not.toBe(active);
    expect(idle).toContain('fill="currentColor"');
    expect(active).toContain('fill="currentColor"');
    expect(idle).not.toContain("lucide-");
    expect(idle).not.toContain("stroke-width");
    expect(active).not.toContain("stroke-width");
  });
});
