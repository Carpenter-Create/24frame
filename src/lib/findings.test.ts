import { describe, expect, it } from "vitest";

import {
  CATALOG_HEALTH_EMPTY,
  CATALOG_HEALTH_SUBTITLE,
  CATALOG_HEALTH_TITLE,
  FINDING_SEVERITY_LABEL,
  catalogHealthCountLabel,
  catalogHealthTitleHref,
} from "./findings";

describe("catalog health findings helpers", () => {
  it("keeps Required / Recommended as the only severity labels", () => {
    expect(FINDING_SEVERITY_LABEL.high).toBe("Required");
    expect(FINDING_SEVERITY_LABEL.low).toBe("Recommended");
    expect(Object.keys(FINDING_SEVERITY_LABEL)).toEqual(["high", "low"]);
  });

  it("names the findings count without inventing a mark-done action", () => {
    expect(catalogHealthCountLabel(1)).toBe("1 finding");
    expect(catalogHealthCountLabel(2)).toBe("2 findings");
    expect(CATALOG_HEALTH_TITLE).toBe("Attention");
    expect(CATALOG_HEALTH_SUBTITLE).toBe("What needs your attention across your catalog.");
    expect(CATALOG_HEALTH_EMPTY).toBe("Nothing needs your attention right now.");
    expect(CATALOG_HEALTH_EMPTY.toLowerCase()).not.toContain("mark");
    expect(CATALOG_HEALTH_EMPTY.toLowerCase()).not.toContain("done");
  });

  it("opens the title so the finding is fixed on the title, not a fake queue action", () => {
    expect(catalogHealthTitleHref("title-acme", false)).toBe("/aggregation/titles/title-acme");
    expect(catalogHealthTitleHref("title-acme", true)).toBe("/aggregation/gc/titles/title-acme");
    expect(catalogHealthTitleHref("title-acme", false)).not.toContain("/metadata");
  });
});
