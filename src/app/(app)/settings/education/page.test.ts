import { describe, expect, it, vi } from "vitest";

import { SETTINGS } from "@/lib/settings";
import SettingsEducationRedirectPage from "./page";

vi.mock("next/navigation", () => ({
  permanentRedirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

describe("SettingsEducationRedirectPage", () => {
  it("permanently redirects education → preferences", () => {
    expect(() => SettingsEducationRedirectPage()).toThrow(`REDIRECT:${SETTINGS.preferencesHref}`);
  });
});
