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
  it("shows the composed place and a remove control", () => {
    const html = renderToStaticMarkup(
      createElement(LocationSearch, {
        initial: { city: "Austin", region: "TX", country: "US" },
      }),
    );
    expect(html).toContain('data-location-current=""');
    expect(html).toContain("Austin, TX, US");
    expect(html).toContain('data-location-clear=""');
    expect(html).toContain(LOCATION.clear);
    expect(html).toContain('data-location-search=""');
    expect(html).not.toContain("truncate");
  });

  it("shows the empty placeholder and no remove control", () => {
    const html = renderToStaticMarkup(
      createElement(LocationSearch, { initial: EMPTY_PROFILE_LOCATION }),
    );
    expect(html).toContain(LOCATION.empty);
    expect(html).not.toContain('data-location-clear=""');
    expect(html).toContain(LOCATION.searchLabel);
  });
});
