import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { EMPTY_PROFILE_LOCATION, LOCATION } from "@/lib/location";
import { LocationSearch } from "./location-search";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/(app)/settings/preferences/location/actions", () => ({
  searchProfilePlaces: vi.fn(async () => []),
  saveProfileLocation: vi.fn(),
  clearProfileLocation: vi.fn(),
}));

describe("LocationSearch", () => {
  it("sits the composed place in the search bar with a trailing clear", () => {
    const html = renderToStaticMarkup(
      createElement(LocationSearch, {
        initial: { city: "Austin", region: "TX", country: "US" },
      }),
    );
    const bar = html.indexOf('data-location-bar=""');
    const value = html.indexOf('data-location-value=""');
    const label = html.indexOf("Austin, TX, US");
    const clear = html.indexOf('data-location-clear=""');
    expect(bar).toBeGreaterThan(-1);
    expect(value).toBeGreaterThan(bar);
    expect(label).toBeGreaterThan(value);
    expect(clear).toBeGreaterThan(label);
    expect(html).toContain(`aria-label="${LOCATION.clear}"`);
    expect(html).not.toContain(`>${LOCATION.clear}<`);
    expect(html).not.toContain('data-location-search=""');
    expect(html).not.toContain('data-location-current=""');
    expect(html).not.toContain("truncate");
    expect(html).toContain("break-words");
  });

  it("is an empty search field with no clear and no stacked value", () => {
    const html = renderToStaticMarkup(
      createElement(LocationSearch, { initial: EMPTY_PROFILE_LOCATION }),
    );
    expect(html).toContain('data-location-bar=""');
    expect(html).toContain('data-location-search=""');
    expect(html).toContain(LOCATION.searchPlaceholder);
    expect(html).toContain(LOCATION.searchLabel);
    expect(html).not.toContain('data-location-clear=""');
    expect(html).not.toContain('data-location-value=""');
    expect(html).not.toContain(LOCATION.empty);
    expect(html).not.toContain("truncate");
  });
});
